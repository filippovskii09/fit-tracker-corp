import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { ResponseMessages } from '@src/common/messages';
import { CreateUserDto, VerifyUserDto } from '@src/users/dto';
import { UsersService } from '@src/users/users.service';
import { EncryptionService } from '@src/encryption/encryption.service';
import { IAuthResponse, IRefreshResponse, ISigninResponse } from './types';
import { registerResponse } from './constants';
import { TokenService } from './token.service';
import { RefreshTokenDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly encryptionService: EncryptionService,
    private readonly tokenService: TokenService,
  ) {}

  private wrongCredentials(): never {
    throw new BadRequestException(ResponseMessages.Auth.WrongCreds);
  }

  async register(dto: CreateUserDto): Promise<IAuthResponse> {
    const existUser = await this.usersService.findByEmail(dto.email);
    if (existUser) {
      throw new BadRequestException(ResponseMessages.Auth.ExistUser);
    }

    await this.usersService.create(dto);

    return registerResponse;
  }

  async signIn(dto: VerifyUserDto): Promise<ISigninResponse> {
    const user = await this.usersService.findByEmailForAuth(dto.email);
    if (!user) {
      this.wrongCredentials();
    }

    const isValidPass = await this.encryptionService.validatePassword(
      user!.passwordHash,
      dto.password,
    );

    if (!isValidPass) {
      this.wrongCredentials();
    }

    const { accessToken, refreshToken } =
      await this.tokenService.generateAuthTokens(user);

    await this.storeRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      message: ResponseMessages.User.SuccessAuthorization,
    };
  }

  async refreshTokens(dto: RefreshTokenDto): Promise<IRefreshResponse> {
    const { refreshToken } = dto;
    const userId = await this.tokenService.verifyRefreshToken(refreshToken);

    const user = await this.usersService.findByIdForAuth(userId);

    if (!user || !user.hashedRefreshToken) {
      throw new ForbiddenException('Access Denied');
    }

    const tokenMatches = await this.encryptionService.validatePassword(
      user.hashedRefreshToken,
      refreshToken,
    );

    if (!tokenMatches) {
      throw new ForbiddenException('Access Denied');
    }

    const tokens = await this.tokenService.generateAuthTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  private async storeRefreshToken(userId: string, refreshToken: string) {
    const hash = await this.encryptionService.hashPassword(refreshToken);
    await this.usersService.updateRefreshToken(userId, hash);
  }
}
