import { Test, TestingModule } from '@nestjs/testing';

import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { userStub } from '../../stubs/user.stub';
import { createMockUsersService } from '../mocks';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;
  const user = userStub();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: createMockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMe', () => {
    it('should call service.findById with userId and return user', async () => {
      const userId = user.id;

      jest.spyOn(service, 'findById').mockResolvedValue(user);

      const result = await controller.getMe(userId);

      expect(result).toEqual(user);
      expect(service.findById).toHaveBeenCalledWith(userId);
    });
  });
});
