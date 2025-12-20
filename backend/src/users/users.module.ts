import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from './entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { EncryptionModule } from '@src/encryption/encryption.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), EncryptionModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
