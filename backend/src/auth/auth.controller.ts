import { Body, Controller, Headers, Logger, Post, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';

import { CookieOptions, Response } from 'express';

import { CreateUserDto, VerifyUserDto } from '@src/users/dto';
import { Cookies, RequestId } from '@src/common/decorators';
import { AUTH_COOKIE_SAME_SITE, NODE_ENV } from '@src/config/constants';
import { PRODUCTION } from '@src/constants';
import { ResponseMessages } from '@src/common/messages';
import { AuthService } from './auth.service';
import {
  IAuthResponse,
  IRefreshResponse,
  ISigninResponse,
  RefreshErrorCode,
} from './types';
import {
  LEGACY_REFRESH_TOKEN_COOKIE_PATH,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_PATH,
} from './constants';
import { RefreshTerminalException } from './exceptions/refresh.exceptions';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private cookieOptions(): CookieOptions {
    const isProduction =
      this.configService.get<string>(NODE_ENV) === PRODUCTION;
    const sameSite =
      this.configService.get<'lax' | 'strict' | 'none'>(
        AUTH_COOKIE_SAME_SITE,
      ) ?? 'lax';
    const secure = isProduction || sameSite === 'none';

    return {
      httpOnly: true,
      secure,
      sameSite,
      path: REFRESH_TOKEN_COOKIE_PATH,
    };
  }

  private setRefreshTokenCookie(res: Response, token: string, expiresAt: Date) {
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, token, {
      ...this.cookieOptions(),
      expires: expiresAt,
    });
  }

  private clearRefreshTokenCookies(res: Response) {
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
      ...this.cookieOptions(),
      path: REFRESH_TOKEN_COOKIE_PATH,
    });
    // Retire the cookie issued at the old, root-scoped path pre-migration.
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
      ...this.cookieOptions(),
      path: LEGACY_REFRESH_TOKEN_COOKIE_PATH,
    });
  }

  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('register')
  async register(@Body() dto: CreateUserDto): Promise<IAuthResponse> {
    return await this.authService.register(dto);
  }

  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('signin')
  async signIn(
    @Body() dto: VerifyUserDto,
    @Res({ passthrough: true }) res: Response,
    @RequestId() requestId: string | undefined,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<Omit<ISigninResponse, 'refreshToken' | 'refreshTokenExpiresAt'>> {
    const { accessToken, refreshToken, refreshTokenExpiresAt, message } =
      await this.authService.signIn(dto, { requestId, userAgent });

    this.setRefreshTokenCookie(res, refreshToken, refreshTokenExpiresAt);
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
      ...this.cookieOptions(),
      path: LEGACY_REFRESH_TOKEN_COOKIE_PATH,
    });

    return { accessToken, message };
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('refresh')
  async refreshToken(
    @Cookies(REFRESH_TOKEN_COOKIE_NAME) refreshToken: string | null,
    @Res({ passthrough: true }) res: Response,
    @RequestId() requestId: string | undefined,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<Omit<IRefreshResponse, 'refreshToken' | 'refreshTokenExpiresAt'>> {
    if (!refreshToken) {
      this.logger.warn({
        event: 'auth.refresh.terminal',
        requestId,
        code: RefreshErrorCode.REFRESH_COOKIE_MISSING,
      });
      this.clearRefreshTokenCookies(res);
      throw new RefreshTerminalException(
        RefreshErrorCode.REFRESH_COOKIE_MISSING,
        ResponseMessages.Auth.RefreshCookieMissing,
      );
    }

    try {
      const tokens = await this.authService.refreshTokens(refreshToken, {
        requestId,
        userAgent,
      });

      if (tokens.refreshToken && tokens.refreshTokenExpiresAt) {
        this.setRefreshTokenCookie(
          res,
          tokens.refreshToken,
          tokens.refreshTokenExpiresAt,
        );
      }
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
        ...this.cookieOptions(),
        path: LEGACY_REFRESH_TOKEN_COOKIE_PATH,
      });

      return { accessToken: tokens.accessToken };
    } catch (error) {
      if (error instanceof RefreshTerminalException) {
        if (error.isLegacy) {
          // A concurrent legacy request may have already upgraded this
          // credential into a brand new session with its own scoped
          // cookie; only retire the old root-scoped cookie here, never
          // the freshly issued Path=/api/v1/auth cookie.
          res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
            ...this.cookieOptions(),
            path: LEGACY_REFRESH_TOKEN_COOKIE_PATH,
          });
        } else {
          this.clearRefreshTokenCookies(res);
        }
      }
      throw error;
    }
  }

  @Post('logout')
  async logout(
    @Cookies(REFRESH_TOKEN_COOKIE_NAME) refreshToken: string | null,
    @Res({ passthrough: true }) res: Response,
    @RequestId() requestId: string | undefined,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<IAuthResponse> {
    try {
      return await this.authService.logout(refreshToken, {
        requestId,
        userAgent,
      });
    } finally {
      // Logout must always expire the cookie client-side, even if the
      // server-side revocation/legacy-clear itself failed.
      this.clearRefreshTokenCookies(res);
    }
  }
}
