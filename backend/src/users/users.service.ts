import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';

import { Repository } from 'typeorm';
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
}
