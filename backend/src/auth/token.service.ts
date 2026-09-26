import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';

import { uuidv7 } from 'uuidv7';

import {
  JWT_ACCESS_TOKEN_SECRET,
  JWT_ACCESS_TOKEN_EXPIRATION_TIME,
  JWT_REFRESH_TOKEN_SECRET,
  JWT_REFRESH_TOKEN_EXPIRATION_TIME,
} from '@src/config/constants';
import { IUser } from '@src/users/types';
import { RefreshJwtPayload } from './types';

export type RefreshVerificationResult =
  | { status: 'valid'; payload: RefreshJwtPayload }
  | { status: 'expired' }
  | { status: 'invalid' };

@Injectable()
export class TokenService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async generateAccessToken(user: Pick<IUser, 'id' | 'email'>) {
    const accessTokenSecret = this.configService.getOrThrow<string>(
      JWT_ACCESS_TOKEN_SECRET,
    );
    const accessTokenExp = this.configService.getOrThrow<number>(
      JWT_ACCESS_TOKEN_EXPIRATION_TIME,
    );

    return this.jwtService.signAsync(
      { sub: user.id, email: user.email, tokenUse: 'access' },
      {
        secret: accessTokenSecret,
        expiresIn: accessTokenExp,
        algorithm: 'HS256',
      },
    );
  }

  /**
   * Signs a session-bound refresh token. When `expiresAt` is provided (a
   * rotation of an existing session) the JWT `exp` is capped to that
   * absolute time instead of restarting the full configured lifetime, so
   * rotation never extends a session past its original absolute expiry.
   */
  async generateSessionRefreshToken(
    user: Pick<IUser, 'id' | 'email'>,
    sessionId: string,
    expiresAt?: Date,
  ): Promise<string> {
    const refreshTokenSecret = this.configService.getOrThrow<string>(
      JWT_REFRESH_TOKEN_SECRET,
    );
    const refreshTokenExp = this.configService.getOrThrow<number>(
      JWT_REFRESH_TOKEN_EXPIRATION_TIME,
    );

    const expiresInSeconds = expiresAt
      ? Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
      : refreshTokenExp;

    const payload: RefreshJwtPayload = {
      sub: user.id,
      email: user.email,
      sid: sessionId,
      jti: uuidv7(),
      tokenUse: 'refresh',
    };

    return this.jwtService.signAsync(payload, {
      secret: refreshTokenSecret,
      expiresIn: expiresInSeconds,
      algorithm: 'HS256',
    });
  }

  async generateAuthTokens(
    user: Pick<IUser, 'id' | 'email'>,
    sessionId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user),
      this.generateSessionRefreshToken(user, sessionId),
    ]);

    return { accessToken, refreshToken };
  }

  getRefreshTokenExpirationSeconds(): number {
    return this.configService.getOrThrow<number>(
      JWT_REFRESH_TOKEN_EXPIRATION_TIME,
    );
  }

  /**
   * Verifies a refresh JWT's signature and expiry, classifying the failure
   * mode so the caller can emit the correct structured reason code. Legacy
   * tokens issued before session support simply lack `sid`/`jti`.
   */
  async verifyRefreshToken(
    refreshToken: string,
  ): Promise<RefreshVerificationResult> {
    const refreshSecret = this.configService.getOrThrow<string>(
      JWT_REFRESH_TOKEN_SECRET,
    );

    try {
      const payload = await this.jwtService.verifyAsync<RefreshJwtPayload>(
        refreshToken,
        { secret: refreshSecret, algorithms: ['HS256'] },
      );

      // Reject an access token presented as a refresh token. Tokens issued
      // before this claim existed (no `tokenUse`) remain accepted during
      // the compatibility window.
      if (payload.tokenUse && payload.tokenUse !== 'refresh') {
        return { status: 'invalid' };
      }

      return { status: 'valid', payload };
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return { status: 'expired' };
      }
      return { status: 'invalid' };
    }
  }

  /**
   * Decodes a refresh JWT's signature-verified claims while ignoring
   * expiration, used only to identify the session to revoke on logout.
   * Never used to authorize a refresh.
   */
  async decodeForLogout(
    refreshToken: string,
  ): Promise<RefreshJwtPayload | null> {
    const refreshSecret = this.configService.getOrThrow<string>(
      JWT_REFRESH_TOKEN_SECRET,
    );

    try {
      return await this.jwtService.verifyAsync<RefreshJwtPayload>(
        refreshToken,
        {
          secret: refreshSecret,
          ignoreExpiration: true,
          algorithms: ['HS256'],
        },
      );
    } catch {
      return null;
    }
  }
}
