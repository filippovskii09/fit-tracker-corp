import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { UsersService } from '../users.service';
import { UserEntity } from '../entity';
import { CreateUserDto } from '../dto';

const mockCreateUserDto: CreateUserDto = {
  email: 'test@example.com',
  firstName: 'John',
  password: 'securePassword1!',
};

const mockUserEntity = {
  id: 'uuid-v7-generated',
  email: mockCreateUserDto.email,
  firstName: mockCreateUserDto.firstName,
  passwordHash: mockCreateUserDto.password,
  createdAt: new Date(),
  updatedAt: new Date(),
} as UserEntity;

const mockUserRepository = {
  save: jest.fn(),
  findOneBy: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<UserEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  describe('create', () => {
    it('should generate UUID, map DTO and save user', async () => {
      jest.spyOn(repository, 'save').mockResolvedValue(mockUserEntity);
      const result = await service.create(mockCreateUserDto);

      expect(result).toEqual(mockUserEntity);

      expect(repository.save).toHaveBeenCalledWith({
        id: expect.any(String),
        email: mockCreateUserDto.email,
        firstName: mockCreateUserDto.firstName,
        passwordHash: mockCreateUserDto.password,
      });
    });

    it('should call findByEmail and return user', async () => {
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockUserEntity);
      const result = await service.findByEmail(mockCreateUserDto.email);

      expect(result).toEqual(mockUserEntity);

      expect(repository.findOneBy).toHaveBeenCalledWith({
        email: mockUserEntity.email,
      });
    });

    it('should return null if user undefined', async () => {
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);
      const result = await service.findByEmail('notfound@mail.com');

      expect(result).toBeNull();
    });
  });
});
