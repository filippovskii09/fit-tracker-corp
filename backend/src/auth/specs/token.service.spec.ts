import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';

import { IUser } from '@src/users/types';
import {
  JWT_ACCESS_TOKEN_SECRET,
  JWT_ACCESS_TOKEN_EXPIRATION_TIME,
  JWT_REFRESH_TOKEN_SECRET,
  JWT_REFRESH_TOKEN_EXPIRATION_TIME,
} from '@src/config/constants';
import { TokenService } from '../token.service';
import { mockConfigService, mockJwtService } from './mocks';

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: JwtService;

  const user: IUser = {
    id: 'user-uuid',
    email: 'test@example.com',
    firstName: 'Test',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const secrets: Record<string, unknown> = {
    [JWT_ACCESS_TOKEN_SECRET]: 'access-secret',
    [JWT_ACCESS_TOKEN_EXPIRATION_TIME]: 900,
    [JWT_REFRESH_TOKEN_SECRET]: 'refresh-secret',
    [JWT_REFRESH_TOKEN_EXPIRATION_TIME]: 604800,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    jwtService = module.get<JwtService>(JwtService);

    mockConfigService.getOrThrow.mockImplementation(
      (key: string) => secrets[key],
    );
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAccessToken', () => {
    it('signs only sub/email with the access secret and lifetime', async () => {
      mockJwtService.signAsync.mockResolvedValue('access.jwt');

      const token = await service.generateAccessToken(user);

      expect(token).toBe('access.jwt');
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: user.id, email: user.email, tokenUse: 'access' },
        { secret: 'access-secret', expiresIn: 900, algorithm: 'HS256' },
      );
    });
  });

  describe('generateSessionRefreshToken', () => {
    it('embeds sid and a jti in the refresh payload', async () => {
      mockJwtService.signAsync.mockResolvedValue('refresh.jwt');

      const token = await service.generateSessionRefreshToken(
        user,
        'session-id',
      );

      expect(token).toBe('refresh.jwt');
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: user.id,
          email: user.email,
          sid: 'session-id',
          jti: expect.any(String),
          tokenUse: 'refresh',
        }),
        { secret: 'refresh-secret', expiresIn: 604800, algorithm: 'HS256' },
      );
    });

    it('caps exp to the session absolute expiresAt on rotation instead of the full lifetime', async () => {
      mockJwtService.signAsync.mockResolvedValue('refresh.jwt');
      const expiresAt = new Date(Date.now() + 60_000); // 60s left, well under 604800

      await service.generateSessionRefreshToken(user, 'session-id', expiresAt);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          expiresIn: expect.any(Number),
        }),
      );
      const [, options] = mockJwtService.signAsync.mock.calls[0];
      expect(options.expiresIn).toBeLessThanOrEqual(60);
      expect(options.expiresIn).toBeGreaterThan(0);
    });
  });

  describe('verifyRefreshToken', () => {
    it('returns the payload when the token is valid', async () => {
      const payload = {
        sub: user.id,
        email: user.email,
        sid: 'sid',
        jti: 'jti',
      };
      mockJwtService.verifyAsync.mockResolvedValue(payload);

      const result = await service.verifyRefreshToken('valid.token');

      expect(result).toEqual({ status: 'valid', payload });
    });

    it('classifies an expired token distinctly from an invalid one', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(
        new TokenExpiredError('jwt expired', new Date()),
      );

      const result = await service.verifyRefreshToken('expired.token');

      expect(result).toEqual({ status: 'expired' });
    });

    it('classifies a bad signature as invalid', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('bad sig'));

      const result = await service.verifyRefreshToken('bad.token');

      expect(result).toEqual({ status: 'invalid' });
    });

    it('rejects an access token presented as a refresh token', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: user.id,
        email: user.email,
        tokenUse: 'access',
      });

      const result = await service.verifyRefreshToken('access.jwt');

      expect(result).toEqual({ status: 'invalid' });
    });

    it('accepts a legacy token with no tokenUse claim', async () => {
      const payload = { sub: user.id, email: user.email };
      mockJwtService.verifyAsync.mockResolvedValue(payload);

      const result = await service.verifyRefreshToken('legacy.token');

      expect(result).toEqual({ status: 'valid', payload });
    });
  });

  describe('decodeForLogout', () => {
    it('returns the payload while ignoring expiration', async () => {
      const payload = { sub: user.id, email: user.email, sid: 'sid' };
      mockJwtService.verifyAsync.mockResolvedValue(payload);

      const result = await service.decodeForLogout('some.token');

      expect(result).toEqual(payload);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('some.token', {
        secret: 'refresh-secret',
        ignoreExpiration: true,
        algorithms: ['HS256'],
      });
    });

    it('returns null when the token cannot be verified at all', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('bad sig'));

      const result = await service.decodeForLogout('garbage');

      expect(result).toBeNull();
    });
  });
});
