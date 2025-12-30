import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { createUserDtoStub, verifyUserDtoStub } from '@src/stubs/user.stub';
import { ResponseMessages } from '@src/common/messages';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { registerResponse } from '../constants';
import { mockAuthService, mockConfigService, mockResponse } from './mocks';
import { tokensStub } from './stubs';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  const createDto = createUserDtoStub();
  const verifyDto = verifyUserDtoStub();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(authController).toBeDefined();
    expect(authService).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register and return message', async () => {
      jest.spyOn(authService, 'register').mockResolvedValue(registerResponse);

      const result = await authController.register(createDto);

      expect(result).toEqual(registerResponse);
      expect(authService.register).toHaveBeenCalledWith(createDto);
    });
  });

  describe('signin', () => {
    it('should call authService.signIn and return tokens', async () => {
      const response = {
        accessToken: tokensStub.accessToken,
        refreshToken: tokensStub.refreshToken,
        message: ResponseMessages.User.SuccessAuthorization,
      };
      jest.spyOn(authService, 'signIn').mockResolvedValue(response);

      const result = await authController.signIn(verifyDto, mockResponse);

      expect(result).toEqual({
        accessToken: response.accessToken,
        message: response.message,
      });

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        tokensStub.refreshToken,
        expect.objectContaining({
          httpOnly: true,
        }),
      );

      expect(authService.signIn).toHaveBeenCalledWith(verifyDto);
    });
  });

  describe('refresh', () => {
    it('should call authService.refreshTokens and return tokens', async () => {
      const refreshToken = tokensStub.refreshToken;
      const refreshRes = {
        accessToken: tokensStub.accessToken,
        refreshToken: tokensStub.refreshToken,
      };

      jest.spyOn(authService, 'refreshTokens').mockResolvedValue(refreshRes);

      const result = await authController.refreshToken(
        refreshToken,
        mockResponse,
      );

      expect(result).toEqual({
        accessToken: refreshRes.accessToken,
      });
      expect(authService.refreshTokens).toHaveBeenCalledWith({
        refreshToken,
      });

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        refreshRes.refreshToken,
        expect.objectContaining({ httpOnly: true }),
      );
    });

    it('should throw UnauthorizedException if refresh token is missing', async () => {
      await expect(
        authController.refreshToken(null, mockResponse),
      ).rejects.toThrow(UnauthorizedException);

      expect(authService.refreshTokens).not.toHaveBeenCalled();
    });
  });
});
