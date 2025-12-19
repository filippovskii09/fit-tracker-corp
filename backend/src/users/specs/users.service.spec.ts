import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { UsersService } from '../users.service';
import { UserEntity } from '../entity';
import { createUserDtoStub, userStub } from './stubs/user.stub';

const mockUserRepository = {
  save: jest.fn(),
  findOneBy: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<UserEntity>;
  const dto = createUserDtoStub();
  const user = userStub();

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
      jest.spyOn(repository, 'save').mockResolvedValue(user);
      const result = await service.create(dto);

      expect(result).toEqual(user);

      expect(repository.save).toHaveBeenCalledWith({
        id: expect.any(String),
        email: dto.email,
        firstName: dto.firstName,
        passwordHash: dto.password,
      });
    });

    it('should call findByEmail and return user', async () => {
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(user);
      const result = await service.findByEmail(dto.email);

      expect(result).toEqual(user);

      expect(repository.findOneBy).toHaveBeenCalledWith({
        email: user.email,
      });
    });

    it('should return null if user undefined', async () => {
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);
      const result = await service.findByEmail('notfound@mail.com');

      expect(result).toBeNull();
    });
  });
});
