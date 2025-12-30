import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Repository, UpdateResult } from 'typeorm';

import { UsersService } from '../users.service';
import { UserEntity } from '../entity';
import { createUserDtoStub, userStub } from '../../stubs/user.stub';
import { EncryptionService } from '@src/encryption/encryption.service';
import { mockEncryptionService, mockUserRepository } from '../mocks';

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

  describe('updateRefreshToken', () => {
    it('should update user refresh token hash', async () => {
      const userId = 'some-uuid';
      const tokenHash = 'some-hash';

      jest.spyOn(repository, 'update').mockResolvedValue({} as UpdateResult);

      await service.updateRefreshToken(userId, tokenHash);

      expect(repository.update).toHaveBeenCalledWith(
        { id: userId },
        { hashedRefreshToken: tokenHash },
      );
    });
  });

  describe('findByIdForAuth', () => {
    it('should find user with specific select fields', async () => {
      const userId = user.id;

      jest.spyOn(repository, 'findOne').mockResolvedValue(user);

      const result = await service.findByIdForAuth(userId);

      expect(result).toEqual(user);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        select: ['id', 'email', 'hashedRefreshToken', 'firstName'],
      });
    });

    it('should return null if user not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      const result = await service.findByIdForAuth('unknown-id');
      expect(result).toBeNull();
    });
  });
});
