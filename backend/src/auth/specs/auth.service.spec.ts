import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, Logger } from '@nestjs/common';

import { UsersService } from '@src/users/users.service';
import {
  createUserDtoStub,
  userStub,
  verifyUserDtoStub,
} from '@src/stubs/user.stub';
import { EncryptionService } from '@src/encryption/encryption.service';
import { ResponseMessages } from '@src/common/messages';
import { AuthService } from '../auth.service';
import { registerResponse } from '../constants';
import { TokenService } from '../token.service';
import { AuthSessionsService } from '../auth-sessions.service';
import { RefreshErrorCode } from '../types';
import { tokensStub } from './stubs';
import { DataSource } from 'typeorm';
import {
  mockAuthSessionsService,
  mockDataSource,
  mockEncryptionService,
  mockTokenService,
  mockUsersService,
} from './mocks';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let tokenService: TokenService;
  let encryptionService: EncryptionService;
  let authSessionsService: AuthSessionsService;

  const registerDto = createUserDtoStub();
  const signInDto = verifyUserDtoStub();

  const user = userStub();

  const hashedRefreshToken = tokensStub.hashedRefreshToken;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: TokenService, useValue: mockTokenService },
        { provide: EncryptionService, useValue: mockEncryptionService },
        { provide: AuthSessionsService, useValue: mockAuthSessionsService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    tokenService = module.get<TokenService>(TokenService);
    encryptionService = module.get<EncryptionService>(EncryptionService);
    authSessionsService = module.get<AuthSessionsService>(AuthSessionsService);

    mockTokenService.generateAccessToken.mockResolvedValue(
      tokensStub.accessToken,
    );
    mockTokenService.generateSessionRefreshToken.mockResolvedValue(
      tokensStub.refreshToken,
    );
    mockTokenService.getRefreshTokenExpirationSeconds.mockReturnValue(604800);
    mockEncryptionService.hashPassword.mockResolvedValue(hashedRefreshToken);
    mockDataSource.transaction.mockImplementation((cb) => cb({} as never));
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(authService).toBeDefined();
    expect(usersService).toBeDefined();
    expect(tokenService).toBeDefined();
    expect(encryptionService).toBeDefined();
    expect(authSessionsService).toBeDefined();
  });

  describe('register', () => {
    it('should call findByEmail and return error if user allready exist', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(user);

      await expect(authService.register(registerDto)).rejects.toThrow(
        new BadRequestException(ResponseMessages.Auth.ExistUser),
      );

      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('should call create and return success message', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(usersService, 'create').mockResolvedValue(user);

      const result = await authService.register(registerDto);

      expect(result).toEqual(registerResponse);
      expect(usersService.create).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('signin', () => {
    it('should throw BadRequest if user not found', async () => {
      jest.spyOn(usersService, 'findByEmailForAuth').mockResolvedValue(null);

      await expect(authService.signIn(signInDto)).rejects.toThrow(
        new BadRequestException(ResponseMessages.Auth.WrongCreds),
      );
    });

    it('should throw BadRequest if password is wrong', async () => {
      jest.spyOn(usersService, 'findByEmailForAuth').mockResolvedValue(user);
      jest
        .spyOn(encryptionService, 'validatePassword')
        .mockResolvedValue(false);

      await expect(authService.signIn(signInDto)).rejects.toThrow(
        new BadRequestException(ResponseMessages.Auth.WrongCreds),
      );
    });

    it('should create an independent session and return tokens', async () => {
      jest.spyOn(usersService, 'findByEmailForAuth').mockResolvedValue(user);
      jest.spyOn(encryptionService, 'validatePassword').mockResolvedValue(true);

      const result = await authService.signIn(signInDto);

      expect(result).toEqual({
        accessToken: tokensStub.accessToken,
        refreshToken: tokensStub.refreshToken,
        refreshTokenExpiresAt: expect.any(Date),
        message: ResponseMessages.User.SuccessAuthorization,
      });

      expect(authSessionsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: user.id,
          tokenHash: hashedRefreshToken,
        }),
      );
      // Sign-in must not touch the legacy single-hash column.
      expect(usersService.updateRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('refreshTokens', () => {
    const presentedToken = 'presented.refresh.token';

    it('should throw a terminal REFRESH_TOKEN_EXPIRED error', async () => {
      mockTokenService.verifyRefreshToken.mockResolvedValue({
        status: 'expired',
      });

      await expect(
        authService.refreshTokens(presentedToken),
      ).rejects.toMatchObject({
        code: RefreshErrorCode.REFRESH_TOKEN_EXPIRED,
      });
    });

    it('should throw a terminal REFRESH_TOKEN_INVALID error for a bad signature', async () => {
      mockTokenService.verifyRefreshToken.mockResolvedValue({
        status: 'invalid',
      });

      await expect(
        authService.refreshTokens(presentedToken),
      ).rejects.toMatchObject({
        code: RefreshErrorCode.REFRESH_TOKEN_INVALID,
      });
    });

    describe('session-bound token (has sid)', () => {
      const sessionId = 'session-uuid';

      beforeEach(() => {
        mockTokenService.verifyRefreshToken.mockResolvedValue({
          status: 'valid',
          payload: { sub: user.id, email: user.email, sid: sessionId },
        });
        jest.spyOn(usersService, 'findByIdForAuth').mockResolvedValue(user);
      });

      it('rotates and returns a new access + refresh token', async () => {
        const sessionExpiresAt = new Date(Date.now() + 604800_000);
        mockAuthSessionsService.verifyAndRotate.mockResolvedValue({
          outcome: 'rotated',
          session: { expiresAt: sessionExpiresAt },
        });

        const result = await authService.refreshTokens(presentedToken);

        expect(result).toEqual({
          accessToken: tokensStub.accessToken,
          refreshToken: tokensStub.refreshToken,
          refreshTokenExpiresAt: sessionExpiresAt,
        });
      });

      it('accepts the previous token within overlap without rotating the cookie', async () => {
        mockAuthSessionsService.verifyAndRotate.mockResolvedValue({
          outcome: 'accepted_previous',
        });

        const result = await authService.refreshTokens(presentedToken);

        expect(result).toEqual({ accessToken: tokensStub.accessToken });
        expect(result.refreshToken).toBeUndefined();
      });

      it.each([
        ['not_found', RefreshErrorCode.SESSION_NOT_FOUND],
        ['revoked', RefreshErrorCode.SESSION_REVOKED],
        ['expired', RefreshErrorCode.SESSION_EXPIRED],
        ['replayed', RefreshErrorCode.REFRESH_REPLAYED],
      ])('maps outcome %s to %s', async (outcome, code) => {
        mockAuthSessionsService.verifyAndRotate.mockResolvedValue({
          outcome,
        });

        await expect(
          authService.refreshTokens(presentedToken),
        ).rejects.toMatchObject({ code });
      });

      it('wraps unexpected infrastructure errors as 503', async () => {
        mockAuthSessionsService.verifyAndRotate.mockRejectedValue(
          new Error('connection reset'),
        );

        await expect(
          authService.refreshTokens(presentedToken),
        ).rejects.toMatchObject({ status: 503 });
      });
    });

    describe('legacy token (no sid)', () => {
      beforeEach(() => {
        mockTokenService.verifyRefreshToken.mockResolvedValue({
          status: 'valid',
          payload: { sub: user.id, email: user.email },
        });
      });

      it('upgrades a valid legacy token into a new session, atomically, and clears the legacy hash', async () => {
        jest
          .spyOn(usersService, 'lockForLegacyRefreshUpgrade')
          .mockResolvedValue({ ...user, hashedRefreshToken });
        jest
          .spyOn(encryptionService, 'validatePassword')
          .mockResolvedValue(true);

        const result = await authService.refreshTokens(presentedToken);

        expect(result).toEqual({
          accessToken: tokensStub.accessToken,
          refreshToken: tokensStub.refreshToken,
          refreshTokenExpiresAt: expect.any(Date),
        });
        expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
        expect(authSessionsService.create).toHaveBeenCalledWith(
          expect.objectContaining({ userId: user.id }),
          expect.anything(),
        );
        expect(usersService.clearRefreshTokenWithManager).toHaveBeenCalledWith(
          expect.anything(),
          user.id,
        );
      });

      it('throws REFRESH_TOKEN_INVALID when the legacy hash does not match', async () => {
        jest
          .spyOn(usersService, 'lockForLegacyRefreshUpgrade')
          .mockResolvedValue({ ...user, hashedRefreshToken });
        jest
          .spyOn(encryptionService, 'validatePassword')
          .mockResolvedValue(false);

        await expect(
          authService.refreshTokens(presentedToken),
        ).rejects.toMatchObject({
          code: RefreshErrorCode.REFRESH_TOKEN_INVALID,
        });
        expect(authSessionsService.create).not.toHaveBeenCalled();
      });

      it('throws REFRESH_TOKEN_INVALID when the user has no legacy hash', async () => {
        jest
          .spyOn(usersService, 'lockForLegacyRefreshUpgrade')
          .mockResolvedValue({ ...user, hashedRefreshToken: null });

        await expect(
          authService.refreshTokens(presentedToken),
        ).rejects.toMatchObject({
          code: RefreshErrorCode.REFRESH_TOKEN_INVALID,
        });
      });

      it("marks every legacy-path terminal failure as isLegacy so the controller preserves a concurrent winner's cookie", async () => {
        jest
          .spyOn(usersService, 'lockForLegacyRefreshUpgrade')
          .mockResolvedValue({ ...user, hashedRefreshToken: null });

        await expect(
          authService.refreshTokens(presentedToken),
        ).rejects.toMatchObject({ isLegacy: true });
      });

      it('serializes concurrent legacy upgrades via the row lock: the loser observes the hash already cleared and gets the legacy terminal failure, never a second session', async () => {
        // Simulates the row lock: the first (winning) transaction observes
        // the still-valid hash; the second (losing) transaction only runs
        // after the winner committed and cleared it.
        jest
          .spyOn(usersService, 'lockForLegacyRefreshUpgrade')
          .mockResolvedValueOnce({ ...user, hashedRefreshToken })
          .mockResolvedValueOnce({ ...user, hashedRefreshToken: null });
        jest
          .spyOn(encryptionService, 'validatePassword')
          .mockResolvedValue(true);

        const winner = await authService.refreshTokens(presentedToken);
        expect(winner).toEqual({
          accessToken: tokensStub.accessToken,
          refreshToken: tokensStub.refreshToken,
          refreshTokenExpiresAt: expect.any(Date),
        });
        expect(usersService.clearRefreshTokenWithManager).toHaveBeenCalledWith(
          expect.anything(),
          user.id,
        );
        expect(authSessionsService.create).toHaveBeenCalledTimes(1);

        await expect(
          authService.refreshTokens(presentedToken),
        ).rejects.toMatchObject({
          code: RefreshErrorCode.REFRESH_TOKEN_INVALID,
          isLegacy: true,
        });
        expect(authSessionsService.create).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('logout', () => {
    it('returns a success message without revoking anything when no cookie is present', async () => {
      const result = await authService.logout(null);

      expect(result).toEqual({ message: ResponseMessages.User.SuccessLogout });
      expect(authSessionsService.revokeCurrent).not.toHaveBeenCalled();
    });

    it('revokes the addressed session when the cookie decodes with a sid', async () => {
      mockTokenService.decodeForLogout.mockResolvedValue({
        sub: user.id,
        sid: 'session-uuid',
      });

      const result = await authService.logout('some.refresh.token');

      expect(result).toEqual({ message: ResponseMessages.User.SuccessLogout });
      expect(authSessionsService.revokeCurrent).toHaveBeenCalledWith(
        'session-uuid',
      );
    });

    it('does not revoke anything for an unverifiable token', async () => {
      mockTokenService.decodeForLogout.mockResolvedValue(null);

      await authService.logout('garbage.token');

      expect(authSessionsService.revokeCurrent).not.toHaveBeenCalled();
      expect(usersService.updateRefreshToken).not.toHaveBeenCalled();
    });

    it('clears the legacy hash when the presented token still matches the stored hash', async () => {
      mockTokenService.decodeForLogout.mockResolvedValue({ sub: user.id });
      jest
        .spyOn(usersService, 'findByIdForAuth')
        .mockResolvedValue({ ...user, hashedRefreshToken });
      jest.spyOn(encryptionService, 'validatePassword').mockResolvedValue(true);

      const result = await authService.logout('legacy.token');

      expect(result).toEqual({ message: ResponseMessages.User.SuccessLogout });
      expect(encryptionService.validatePassword).toHaveBeenCalledWith(
        hashedRefreshToken,
        'legacy.token',
      );
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        user.id,
        null,
      );
      expect(authSessionsService.revokeCurrent).not.toHaveBeenCalled();
    });

    it('does not clear the hash for a stale/superseded legacy token from another device', async () => {
      // Signature-valid (decodeForLogout ignores expiration) but no longer
      // the credential on file, e.g. device B already rotated/replaced it.
      mockTokenService.decodeForLogout.mockResolvedValue({ sub: user.id });
      jest
        .spyOn(usersService, 'findByIdForAuth')
        .mockResolvedValue({ ...user, hashedRefreshToken });
      jest
        .spyOn(encryptionService, 'validatePassword')
        .mockResolvedValue(false);

      const result = await authService.logout('stale-device-a.token');

      expect(result).toEqual({ message: ResponseMessages.User.SuccessLogout });
      expect(usersService.updateRefreshToken).not.toHaveBeenCalled();
      expect(authSessionsService.revokeCurrent).not.toHaveBeenCalled();
    });

    it('does not clear the hash when the user has no legacy hash on file', async () => {
      mockTokenService.decodeForLogout.mockResolvedValue({ sub: user.id });
      jest
        .spyOn(usersService, 'findByIdForAuth')
        .mockResolvedValue({ ...user, hashedRefreshToken: null });

      await authService.logout('legacy.token');

      expect(usersService.updateRefreshToken).not.toHaveBeenCalled();
      expect(encryptionService.validatePassword).not.toHaveBeenCalled();
    });

    it('still lets the caller expire the cookie by surfacing a 503 when revocation fails', async () => {
      mockTokenService.decodeForLogout.mockResolvedValue({
        sub: user.id,
        sid: 'session-uuid',
      });
      mockAuthSessionsService.revokeCurrent.mockRejectedValue(
        new Error('db unreachable'),
      );

      await expect(
        authService.logout('some.refresh.token'),
      ).rejects.toMatchObject({ status: 503 });
    });
  });

  describe('privacy-safe logging', () => {
    it('never logs the raw refresh/access token values', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');
      const warnSpy = jest.spyOn(Logger.prototype, 'warn');

      jest.spyOn(usersService, 'findByEmailForAuth').mockResolvedValue(user);
      jest.spyOn(encryptionService, 'validatePassword').mockResolvedValue(true);

      await authService.signIn(signInDto);

      const allLoggedArgs = [...logSpy.mock.calls, ...warnSpy.mock.calls]
        .map((call) => JSON.stringify(call))
        .join('\n');

      expect(allLoggedArgs).not.toContain(tokensStub.accessToken);
      expect(allLoggedArgs).not.toContain(tokensStub.refreshToken);
      expect(allLoggedArgs).not.toContain(hashedRefreshToken);
      expect(allLoggedArgs).not.toContain(signInDto.password);

      logSpy.mockRestore();
      warnSpy.mockRestore();
    });
  });
});
