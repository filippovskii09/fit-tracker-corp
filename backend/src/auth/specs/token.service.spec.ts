import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ForbiddenException } from '@nestjs/common';

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAuthTokens', () => {
    it('should generate access and refresh tokens', async () => {
      const accessTokenSecret = 'access-secret';
      const accessTokenExp = 900;
      const refreshTokenSecret = 'refresh-secret';
      const refreshTokenExp = 604800;
      const mockToken = 'generated.jwt.token';

      mockConfigService.getOrThrow.mockImplementation((key: string) => {
        switch (key) {
          case JWT_ACCESS_TOKEN_SECRET:
            return accessTokenSecret;
          case JWT_ACCESS_TOKEN_EXPIRATION_TIME:
            return accessTokenExp;
          case JWT_REFRESH_TOKEN_SECRET:
            return refreshTokenSecret;
          case JWT_REFRESH_TOKEN_EXPIRATION_TIME:
            return refreshTokenExp;
          default:
            return null;
        }
      });

      mockJwtService.signAsync.mockResolvedValue(mockToken);

      const result = await service.generateAuthTokens(user);

      expect(result).toEqual({
        accessToken: mockToken,
        refreshToken: mockToken,
      });

      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: user.id, email: user.email },
        { secret: accessTokenSecret, expiresIn: accessTokenExp },
      );

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: user.id, email: user.email },
        { secret: refreshTokenSecret, expiresIn: refreshTokenExp },
      );
    });
  });

  describe('verifyRefreshToken', () => {
    const token = 'valid.refresh.token';
    const secret = 'refresh-secret';

    it('should return user id if token is valid', async () => {
      mockConfigService.get.mockReturnValue(secret);
      mockJwtService.verifyAsync.mockResolvedValue({ sub: user.id });

      const result = await service.verifyRefreshToken(token);

      expect(result).toBe(user.id);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, { secret });
    });

    it('should throw ForbiddenException if token is invalid', async () => {
      mockConfigService.get.mockReturnValue(secret);
      mockJwtService.verifyAsync.mockRejectedValue(
        new Error('Invalid signature'),
      );
      await expect(service.verifyRefreshToken(token)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
