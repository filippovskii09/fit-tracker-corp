import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';

import { EntityManager, Repository } from 'typeorm';
import { uuidv7 } from 'uuidv7';

import { CreateUserDto } from './dto';
import { UserEntity } from './entity';
import { EncryptionService } from '@src/encryption/encryption.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly encryptionService: EncryptionService,
  ) {}

  async create(dto: CreateUserDto): Promise<UserEntity> {
    const hashedPassword = await this.encryptionService.hashPassword(
      dto.password,
    );
    const newUser: Partial<UserEntity> = {
      id: uuidv7(),
      email: dto.email,
      firstName: dto.firstName,
      passwordHash: hashedPassword,
    };
    return await this.userRepository.save(newUser);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return await this.userRepository.findOneBy({ email });
  }

  async findByEmailForAuth(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'passwordHash', 'firstName'],
    });
  }

  async updateRefreshToken(
    userId: string,
    refreshTokenHash: string | null,
  ): Promise<void> {
    await this.userRepository.update(
      { id: userId },
      { hashedRefreshToken: refreshTokenHash },
    );
  }

  async findByIdForAuth(id: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'hashedRefreshToken', 'firstName'],
    });
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  /**
   * Locks the user row (`FOR UPDATE`) within the caller's transaction and
   * returns it with `hashedRefreshToken` selected, so a legacy refresh
   * upgrade can validate-then-clear the credential atomically without a
   * concurrent request observing the same still-valid hash.
   */
  async lockForLegacyRefreshUpgrade(
    manager: EntityManager,
    userId: string,
  ): Promise<UserEntity | null> {
    return manager
      .getRepository(UserEntity)
      .createQueryBuilder('user')
      .addSelect(['user.hashedRefreshToken'])
      .where('user.id = :userId', { userId })
      .setLock('pessimistic_write')
      .getOne();
  }

  async clearRefreshTokenWithManager(
    manager: EntityManager,
    userId: string,
  ): Promise<void> {
    await manager
      .getRepository(UserEntity)
      .update({ id: userId }, { hashedRefreshToken: null });
  }
}
