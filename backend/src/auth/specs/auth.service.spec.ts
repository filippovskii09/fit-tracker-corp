import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

import { UsersService } from '@src/users/users.service';
import { createUserDtoStub, userStub } from '@src/stubs/user.stub';
import { ResponseMessages } from '@src/common/messages';
import { AuthService } from '../auth.service';

const mockUsersService = {
  findByEmail: jest.fn(),
  create: jest.fn(),
};

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
    expect(usersService).toBeDefined();
  });

  describe('register', () => {
    it('should call findByEmail and return error if user allready exist', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(userStub());

      await expect(authService.register(createUserDtoStub())).rejects.toThrow(
        BadRequestException,
      );

      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('should call create and return success message', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(usersService, 'create').mockResolvedValue(userStub());

      const result = await authService.register(createUserDtoStub());

      expect(result).toEqual({
        message: ResponseMessages.User.SuccessRegistration,
      });

      expect(usersService.create).toHaveBeenCalledWith(createUserDtoStub());
    });
  });
});
