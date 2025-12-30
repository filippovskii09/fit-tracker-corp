import {
  Body,
  Controller,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Response } from 'express';

import { CreateUserDto, VerifyUserDto } from '@src/users/dto';
import { Cookies } from '@src/common/decorators';
import { NODE_ENV } from '@src/config/constants';
import { PRODUCTION } from '@src/constants';
import { AuthService } from './auth.service';
import { IAuthResponse, IRefreshResponse, ISigninResponse } from './types';
import { RefreshTokenDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private setRefreshTokenCookie(res: Response, token: string) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: this.configService.get<string>(NODE_ENV) === PRODUCTION,
      sameSite: 'lax',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  }

  @Post('register')
  async register(@Body() dto: CreateUserDto): Promise<IAuthResponse> {
    return await this.authService.register(dto);
  }

  @Post('signin')
  async signIn(
    @Body() dto: VerifyUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Omit<ISigninResponse, 'refreshToken'>> {
    const { accessToken, refreshToken, message } =
      await this.authService.signIn(dto);

    this.setRefreshTokenCookie(res, refreshToken);

    return { accessToken, message };
  }

  @Post('refresh')
  async refreshToken(
    @Cookies('refreshToken') refreshToken: string | null,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Omit<IRefreshResponse, 'refreshToken'>> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found!');
    }
    const tokenDto: RefreshTokenDto = { refreshToken };
    const tokens = await this.authService.refreshTokens(tokenDto);
    this.setRefreshTokenCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }
}
