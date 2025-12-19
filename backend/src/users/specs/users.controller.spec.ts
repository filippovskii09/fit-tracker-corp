import { Test, TestingModule } from '@nestjs/testing';

import { CreateUserDto } from '../dto';
import { UserEntity } from '../entity';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { ResponseMessages } from '@src/common/messages';

const mockCreateUserDto: CreateUserDto = {
  email: 'example@gmail.com',
  firstName: 'test',
  password: '3edc$RFV',
};

const mockUserEntity = {
  id: 'uuui=v7',
  ...mockCreateUserDto,
  passwordHash: mockCreateUserDto.password,
  createdAt: new Date(),
  updatedAt: new Date(),
} as UserEntity;

const createMockUsersService = () => ({
  create: jest.fn(),
});

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

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
      jest.spyOn(service, 'create').mockResolvedValue(mockUserEntity);

      const result = await controller.create(mockCreateUserDto);

      expect(result).toEqual(ResponseMessages.User.SuccessRegistration);
      expect(service.create).toHaveBeenCalledWith(mockCreateUserDto);
    });
  });
});
