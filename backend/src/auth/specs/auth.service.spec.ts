import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

import { UsersService } from '@src/users/users.service';
import { createUserDtoStub, userStub } from '@src/stubs/user.stub';
import { AuthService } from '../auth.service';
import { registerResponse } from '../constants';

const mockUsersService = {
  findByEmail: jest.fn(),
  create: jest.fn(),
};

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;

  const dto = createUserDtoStub();
  const user = userStub();

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
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(user);

      await expect(authService.register(dto)).rejects.toThrow(
        BadRequestException,
      );

      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('should call create and return success message', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(usersService, 'create').mockResolvedValue(user);

      const result = await authService.register(dto);

      expect(result).toEqual(registerResponse);

      expect(usersService.create).toHaveBeenCalledWith(dto);
    });
  });
});
