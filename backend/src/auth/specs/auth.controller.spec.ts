import { Test, TestingModule } from '@nestjs/testing';

import { createUserDtoStub } from '@src/stubs/user.stub';
import { ResponseMessages } from '@src/common/messages';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

const createMockAuthService = () => ({
  register: jest.fn(),
});

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  const dto = createUserDtoStub();

  const registerResponse = {
    message: ResponseMessages.User.SuccessRegistration,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: AuthService,
          useValue: createMockAuthService(),
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

  describe('regsiter', () => {
    it('should call authService.register and return message', async () => {
      jest.spyOn(authService, 'register').mockResolvedValue(registerResponse);

      const result = await authController.register(dto);

      expect(result).toEqual(registerResponse);
      expect(authService.register).toHaveBeenCalledWith(dto);
    });
  });
});
