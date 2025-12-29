import { Test, TestingModule } from '@nestjs/testing';

import { createUserDtoStub, verifyUserDtoStub } from '@src/stubs/user.stub';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { registerResponse } from '../constants';
import { mockAuthService } from './mocks';
import { ResponseMessages } from '@src/common/messages';
import { RefreshTokenDto } from '../dto';

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
        accessToken: 'example_token',
        message: ResponseMessages.User.SuccessAuthorization,
      };
      jest.spyOn(authService, 'signIn').mockResolvedValue(response);

      const result = await authController.signIn(verifyDto);

      expect(result).toEqual(response);
      expect(authService.signIn).toHaveBeenCalledWith(verifyDto);
    });
  });

  describe('refresh', () => {
    it('should call authService.refreshTokens and return tokens', async () => {
      const dto: RefreshTokenDto = { refreshToken: 'example_token' };
      const refresh = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      };

      jest.spyOn(authService, 'refreshTokens').mockResolvedValue(refresh);

      const result = await authController.refreshToken(dto);

      expect(result).toEqual(refresh);
      expect(authService.refreshTokens).toHaveBeenCalledWith(dto);
    });
  });
});
