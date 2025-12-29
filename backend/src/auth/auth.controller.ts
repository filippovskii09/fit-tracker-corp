import { Body, Controller, Post } from '@nestjs/common';

import { CreateUserDto, VerifyUserDto } from '@src/users/dto';
import { AuthService } from './auth.service';
import { IAuthResponse, ISigninResponse } from './types';
import { RefreshTokenDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: CreateUserDto): Promise<IAuthResponse> {
    return await this.authService.register(dto);
  }

  @Post('signin')
  async signIn(@Body() dto: VerifyUserDto): Promise<ISigninResponse> {
    return await this.authService.signIn(dto);
  }

  @Post('refresh')
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return await this.authService.refreshTokens(dto);
  }
}
