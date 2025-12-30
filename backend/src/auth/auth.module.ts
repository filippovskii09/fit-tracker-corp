import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '@src/users/users.module';
import { EncryptionModule } from '@src/encryption/encryption.module';
import { TokenService } from './token.service';

@Module({
  imports: [UsersModule, EncryptionModule, JwtModule.register({})],
  providers: [AuthService, TokenService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
