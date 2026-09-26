import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '@src/users/users.module';
import { EncryptionModule } from '@src/encryption/encryption.module';
import { TokenService } from './token.service';
import { AuthSessionsService } from './auth-sessions.service';
import { AuthSessionEntity } from './entities';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    EncryptionModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([AuthSessionEntity]),
  ],
  providers: [AuthService, TokenService, AuthSessionsService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
