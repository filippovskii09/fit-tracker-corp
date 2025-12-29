import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import {
  JWT_ACCESS_TOKEN_SECRET,
  JWT_ACCESS_TOKEN_EXPIRATION_TIME,
  JWT_REFRESH_TOKEN_SECRET,
  JWT_REFRESH_TOKEN_EXPIRATION_TIME,
} from '@src/config/constants';
import { IUser } from '@src/users/types';

@Injectable()
export class TokenService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async generateAuthTokens(
    user: IUser,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: user.id, email: user.email };

    const accessTokenSecret = this.configService.getOrThrow<string>(
      JWT_ACCESS_TOKEN_SECRET,
    );
    const accessTokenExp = this.configService.getOrThrow<number>(
      JWT_ACCESS_TOKEN_EXPIRATION_TIME,
    );

    const refreshTokenSecret = this.configService.getOrThrow<string>(
      JWT_REFRESH_TOKEN_SECRET,
    );
    const refreshTokenExp = this.configService.getOrThrow<number>(
      JWT_REFRESH_TOKEN_EXPIRATION_TIME,
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenSign(payload, accessTokenSecret, accessTokenExp),
      this.tokenSign(payload, refreshTokenSecret, refreshTokenExp),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async verifyRefreshToken(refreshToken: string): Promise<string> {
    try {
      const refreshSecret = this.configService.get<string>(
        JWT_REFRESH_TOKEN_SECRET,
      );
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: refreshSecret,
      });
      return payload.sub;
    } catch {
      throw new ForbiddenException('Invalid Refresh Token');
    }
  }

  private tokenSign(
    payload: { sub: string; email: string },
    jwtSecret: string,
    jwtExpiration: number,
  ) {
    return this.jwtService.signAsync(payload, {
      secret: jwtSecret,
      expiresIn: jwtExpiration,
    });
  }
}
