import { Test, TestingModule } from '@nestjs/testing';

import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { ResponseMessages } from '@src/common/messages';
import { createUserDtoStub, userStub } from './stubs/user.stub';

const createMockUsersService = () => ({
  create: jest.fn(),
});

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;
  const dto = createUserDtoStub();
  const user = userStub();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: createMockUsersService(),
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

  describe('create', () => {
    it('should call service.create with dto and return user', async () => {
      jest.spyOn(service, 'create').mockResolvedValue(user);

      const result = await controller.create(dto);

      expect(result).toEqual(ResponseMessages.User.SuccessRegistration);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });
});
