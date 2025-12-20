import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { UsersService } from '../users.service';
import { UserEntity } from '../entity';
import { createUserDtoStub, userStub } from '../../stubs/user.stub';
import { EncryptionService } from '@src/encryption/encryption.service';

const mockUserRepository = {
  save: jest.fn(),
  findOneBy: jest.fn(),
};

const mockEncryptionService = {
  hashPassword: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<UserEntity>;
  let encryption: EncryptionService;

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
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    encryption = module.get<EncryptionService>(EncryptionService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  describe('create', () => {
    it('should generate UUID, map DTO and save user', async () => {
      const hashedPassword = 'some_hashed_password';

      jest.spyOn(encryption, 'hashPassword').mockResolvedValue(hashedPassword);
      jest.spyOn(repository, 'save').mockResolvedValue(user);

      const result = await service.create(dto);

      expect(result).toEqual(user);

      expect(encryption.hashPassword).toHaveBeenCalledWith(dto.password);

      expect(repository.save).toHaveBeenCalledWith({
        id: expect.any(String),
        email: dto.email,
        firstName: dto.firstName,
        passwordHash: hashedPassword,
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
