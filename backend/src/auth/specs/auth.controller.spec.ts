import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { createUserDtoStub, verifyUserDtoStub } from '@src/stubs/user.stub';
import { ResponseMessages } from '@src/common/messages';
import { AUTH_COOKIE_SAME_SITE } from '@src/config/constants';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { registerResponse } from '../constants';
import { RefreshErrorCode } from '../types';
import {
  AuthServiceUnavailableException,
  RefreshTerminalException,
} from '../exceptions/refresh.exceptions';
import { mockAuthService, mockConfigService, mockResponse } from './mocks';
import { tokensStub } from './stubs';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  const createDto = createUserDtoStub();
  const verifyDto = verifyUserDtoStub();
  const requestId = 'req-1';
  const userAgent = 'jest-agent';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    mockConfigService.get.mockImplementation((key: string) => {
      if (key === AUTH_COOKIE_SAME_SITE) return 'lax';
      return 'development';
    });
    mockConfigService.getOrThrow.mockReturnValue(604800);
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
    it('should call authService.signIn, set the scoped cookie, and clear the legacy one', async () => {
      const response = {
        accessToken: tokensStub.accessToken,
        refreshToken: tokensStub.refreshToken,
        refreshTokenExpiresAt: tokensStub.refreshTokenExpiresAt,
        message: ResponseMessages.User.SuccessAuthorization,
      };
      jest.spyOn(authService, 'signIn').mockResolvedValue(response);

      const result = await authController.signIn(
        verifyDto,
        mockResponse,
        requestId,
        userAgent,
      );

      expect(result).toEqual({
        accessToken: response.accessToken,
        message: response.message,
      });

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        tokensStub.refreshToken,
        expect.objectContaining({
          expires: expect.any(Date),
          httpOnly: true,
          sameSite: 'lax',
          secure: false,
          path: '/api/v1/auth',
        }),
      );
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({ path: '/' }),
      );

      expect(authService.signIn).toHaveBeenCalledWith(verifyDto, {
        requestId,
        userAgent,
      });
    });

    it('forces Secure when AUTH_COOKIE_SAME_SITE=none regardless of NODE_ENV', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === AUTH_COOKIE_SAME_SITE) return 'none';
        return 'development';
      });
      jest.spyOn(authService, 'signIn').mockResolvedValue({
        accessToken: tokensStub.accessToken,
        refreshToken: tokensStub.refreshToken,
        refreshTokenExpiresAt: tokensStub.refreshTokenExpiresAt,
        message: ResponseMessages.User.SuccessAuthorization,
      });

      await authController.signIn(
        verifyDto,
        mockResponse,
        requestId,
        userAgent,
      );

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        tokensStub.refreshToken,
        expect.objectContaining({ sameSite: 'none', secure: true }),
      );
    });
  });

  describe('refresh', () => {
    it('sets a new cookie only when the service rotates the token', async () => {
      jest.spyOn(authService, 'refreshTokens').mockResolvedValue({
        accessToken: tokensStub.accessToken,
        refreshToken: tokensStub.refreshToken,
        refreshTokenExpiresAt: tokensStub.refreshTokenExpiresAt,
      });

      const result = await authController.refreshToken(
        tokensStub.refreshToken,
        mockResponse,
        requestId,
        userAgent,
      );

      expect(result).toEqual({ accessToken: tokensStub.accessToken });
      expect(authService.refreshTokens).toHaveBeenCalledWith(
        tokensStub.refreshToken,
        { requestId, userAgent },
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        tokensStub.refreshToken,
        expect.objectContaining({ path: '/api/v1/auth' }),
      );
    });

    it('does not set a cookie when the previous token was accepted within overlap', async () => {
      jest.spyOn(authService, 'refreshTokens').mockResolvedValue({
        accessToken: tokensStub.accessToken,
      });

      const result = await authController.refreshToken(
        tokensStub.refreshToken,
        mockResponse,
        requestId,
        userAgent,
      );

      expect(result).toEqual({ accessToken: tokensStub.accessToken });
      expect(mockResponse.cookie).not.toHaveBeenCalled();
    });

    it('throws REFRESH_COOKIE_MISSING and expires cookies when no cookie is present', async () => {
      await expect(
        authController.refreshToken(null, mockResponse, requestId, userAgent),
      ).rejects.toMatchObject({
        code: RefreshErrorCode.REFRESH_COOKIE_MISSING,
      });

      expect(authService.refreshTokens).not.toHaveBeenCalled();
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({ path: '/api/v1/auth' }),
      );
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({ path: '/' }),
      );
    });

    it('expires the cookies on a terminal failure from the service', async () => {
      jest
        .spyOn(authService, 'refreshTokens')
        .mockRejectedValue(
          new RefreshTerminalException(
            RefreshErrorCode.SESSION_REVOKED,
            'revoked',
          ),
        );

      await expect(
        authController.refreshToken(
          tokensStub.refreshToken,
          mockResponse,
          requestId,
          userAgent,
        ),
      ).rejects.toMatchObject({ code: RefreshErrorCode.SESSION_REVOKED });

      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({ path: '/api/v1/auth' }),
      );
    });

    it('only clears the legacy root-path cookie for a legacy-path terminal failure, never the scoped cookie', async () => {
      jest
        .spyOn(authService, 'refreshTokens')
        .mockRejectedValue(
          new RefreshTerminalException(
            RefreshErrorCode.REFRESH_TOKEN_INVALID,
            'legacy hash mismatch',
            true,
          ),
        );

      await expect(
        authController.refreshToken(
          tokensStub.refreshToken,
          mockResponse,
          requestId,
          userAgent,
        ),
      ).rejects.toMatchObject({ code: RefreshErrorCode.REFRESH_TOKEN_INVALID });

      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({ path: '/' }),
      );
      expect(mockResponse.clearCookie).not.toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({ path: '/api/v1/auth' }),
      );
    });
  });

  describe('logout', () => {
    it('always clears both cookie paths and returns the service message', async () => {
      jest
        .spyOn(authService, 'logout')
        .mockResolvedValue({ message: ResponseMessages.User.SuccessLogout });

      const result = await authController.logout(
        tokensStub.refreshToken,
        mockResponse,
        requestId,
        userAgent,
      );

      expect(result).toEqual({ message: ResponseMessages.User.SuccessLogout });
      expect(authService.logout).toHaveBeenCalledWith(tokensStub.refreshToken, {
        requestId,
        userAgent,
      });
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({ path: '/api/v1/auth' }),
      );
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({ path: '/' }),
      );
    });

    it('is idempotent when no cookie is present', async () => {
      jest
        .spyOn(authService, 'logout')
        .mockResolvedValue({ message: ResponseMessages.User.SuccessLogout });

      const result = await authController.logout(
        null,
        mockResponse,
        requestId,
        userAgent,
      );

      expect(result).toEqual({ message: ResponseMessages.User.SuccessLogout });
    });

    it('still expires cookies and surfaces 503 when the service fails to revoke', async () => {
      jest
        .spyOn(authService, 'logout')
        .mockRejectedValue(new AuthServiceUnavailableException('down'));

      await expect(
        authController.logout(
          tokensStub.refreshToken,
          mockResponse,
          requestId,
          userAgent,
        ),
      ).rejects.toMatchObject({ status: 503 });

      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({ path: '/api/v1/auth' }),
      );
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({ path: '/' }),
      );
    });
  });
});
