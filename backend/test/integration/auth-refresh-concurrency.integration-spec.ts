import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { DataSource } from 'typeorm';
import { uuidv7 } from 'uuidv7';

import { envSchema } from '@src/config/env.validation';
import {
  JWT_REFRESH_TOKEN_SECRET,
  JWT_REFRESH_TOKEN_EXPIRATION_TIME,
} from '@src/config/constants';
import { DBModule } from '@src/db/db.module';
import { UsersModule } from '@src/users/users.module';
import { UsersService } from '@src/users/users.service';
import { EncryptionService } from '@src/encryption/encryption.service';
import { EncryptionModule } from '@src/encryption/encryption.module';
import { AuthModule } from '@src/auth/auth.module';
import { AuthService } from '@src/auth/auth.service';
import { AuthSessionsService } from '@src/auth/auth-sessions.service';

/**
 * Proves the concurrency invariants from B1/B11 against real PostgreSQL:
 * two parallel refresh attempts (session-bound and legacy) can never both
 * "win" — exactly one credential rotation / session upgrade happens, and the
 * other request gets the documented non-destructive outcome.
 */
describe('auth refresh concurrency (PostgreSQL integration)', () => {
  let moduleRef: TestingModule;
  let usersService: UsersService;
  let encryptionService: EncryptionService;
  let authService: AuthService;
  let authSessionsService: AuthSessionsService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let dataSource: DataSource;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, validationSchema: envSchema }),
        DBModule,
        UsersModule,
        EncryptionModule,
        AuthModule,
      ],
    }).compile();

    usersService = moduleRef.get(UsersService);
    encryptionService = moduleRef.get(EncryptionService);
    authService = moduleRef.get(AuthService);
    authSessionsService = moduleRef.get(AuthSessionsService);
    jwtService = moduleRef.get(JwtService);
    configService = moduleRef.get(ConfigService);
    dataSource = moduleRef.get(DataSource);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('verifyAndRotate: two parallel refreshes with the same current token yield exactly one rotated and one accepted_previous', async () => {
    const user = await usersService.create({
      email: `concurrency-${uuidv7()}@example.com`,
      password: 'Str0ng!Passw0rd',
      firstName: 'Concurrency',
    });

    const sessionId = uuidv7();
    const currentToken = `token-${uuidv7()}`;
    const currentTokenHash = await encryptionService.hashPassword(currentToken);

    await authSessionsService.create({
      id: sessionId,
      userId: user.id,
      tokenHash: currentTokenHash,
      expiresAt: new Date(Date.now() + 60_000),
    });

    // Precompute both new hashes before starting either call, so both
    // requests actually enter verifyAndRotate in the same tick and race on
    // the row lock, instead of one being serialized behind the other's
    // await of hashPassword.
    const [newHashA, newHashB] = await Promise.all([
      encryptionService.hashPassword(`new-a-${uuidv7()}`),
      encryptionService.hashPassword(`new-b-${uuidv7()}`),
    ]);

    const [resultA, resultB] = await Promise.all([
      authSessionsService.verifyAndRotate(sessionId, currentToken, newHashA),
      authSessionsService.verifyAndRotate(sessionId, currentToken, newHashB),
    ]);

    const outcomes = [resultA.outcome, resultB.outcome].sort();
    expect(outcomes).toEqual(['accepted_previous', 'rotated']);

    // currentTokenHash is `select: false` on the entity; read it directly to
    // confirm the winning hash was actually persisted (not just reported).
    const [persisted] = (await dataSource.query(
      `SELECT "currentTokenHash" FROM auth_sessions WHERE id = $1`,
      [sessionId],
    )) as { currentTokenHash: string }[];
    expect([newHashA, newHashB]).toContain(persisted?.currentTokenHash);
  });

  it('legacy upgrade: two parallel refreshes with the same legacy token yield exactly one upgrade, never two sessions', async () => {
    const user = await usersService.create({
      email: `legacy-${uuidv7()}@example.com`,
      password: 'Str0ng!Passw0rd',
      firstName: 'Legacy',
    });

    const refreshSecret = configService.getOrThrow<string>(
      JWT_REFRESH_TOKEN_SECRET,
    );
    const refreshExp = configService.getOrThrow<number>(
      JWT_REFRESH_TOKEN_EXPIRATION_TIME,
    );
    const legacyToken = await jwtService.signAsync(
      { sub: user.id, email: user.email },
      { secret: refreshSecret, expiresIn: refreshExp, algorithm: 'HS256' },
    );
    const legacyHash = await encryptionService.hashPassword(legacyToken);
    await usersService.updateRefreshToken(user.id, legacyHash);

    const results = await Promise.allSettled([
      authService.refreshTokens(legacyToken),
      authService.refreshTokens(legacyToken),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toMatchObject({
      isLegacy: true,
    });

    const refreshedUser = await usersService.findByIdForAuth(user.id);
    expect(refreshedUser?.hashedRefreshToken).toBeNull();
  });
});
