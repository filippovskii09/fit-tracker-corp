import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { DataSource, EntityManager } from 'typeorm';
import { uuidv7 } from 'uuidv7';

import { ResponseMessages } from '@src/common/messages';
import { CreateUserDto, VerifyUserDto } from '@src/users/dto';
import { UsersService } from '@src/users/users.service';
import { EncryptionService } from '@src/encryption/encryption.service';
import {
  IAuthResponse,
  IRefreshResponse,
  ISigninResponse,
  RefreshErrorCode,
} from './types';
import { registerResponse } from './constants';
import { TokenService } from './token.service';
import { AuthSessionsService } from './auth-sessions.service';
import {
  AuthServiceUnavailableException,
  RefreshTerminalException,
} from './exceptions/refresh.exceptions';

export interface AuthRequestMeta {
  requestId?: string;
  userAgent?: string | null;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly encryptionService: EncryptionService,
    private readonly tokenService: TokenService,
    private readonly authSessionsService: AuthSessionsService,
    private readonly dataSource: DataSource,
  ) {}

  private wrongCredentials(): never {
    throw new BadRequestException(ResponseMessages.Auth.WrongCreds);
  }

  private logEvent(
    level: 'log' | 'warn' | 'error',
    event: string,
    meta: AuthRequestMeta,
    fields: Record<string, unknown> = {},
  ) {
    this.logger[level]({
      event,
      requestId: meta.requestId,
      ...fields,
    });
  }

  private async sessionExpiresAt(): Promise<Date> {
    return new Date(
      Date.now() + this.tokenService.getRefreshTokenExpirationSeconds() * 1000,
    );
  }

  async register(dto: CreateUserDto): Promise<IAuthResponse> {
    const existUser = await this.usersService.findByEmail(dto.email);
    if (existUser) {
      throw new BadRequestException(ResponseMessages.Auth.ExistUser);
    }

    await this.usersService.create(dto);

    return registerResponse;
  }

  async signIn(
    dto: VerifyUserDto,
    meta: AuthRequestMeta = {},
  ): Promise<ISigninResponse> {
    const user = await this.usersService.findByEmailForAuth(dto.email);
    if (!user) {
      this.logEvent('warn', 'auth.signin.failed', meta, {
        reason: 'user_not_found',
      });
      this.wrongCredentials();
    }

    const isValidPass = await this.encryptionService.validatePassword(
      user!.passwordHash,
      dto.password,
    );

    if (!isValidPass) {
      this.logEvent('warn', 'auth.signin.failed', meta, {
        userId: user!.id,
        reason: 'wrong_password',
      });
      this.wrongCredentials();
    }

    const sessionId = uuidv7();
    const expiresAt = await this.sessionExpiresAt();
    const accessToken = await this.tokenService.generateAccessToken(user!);
    const refreshToken = await this.tokenService.generateSessionRefreshToken(
      user!,
      sessionId,
      expiresAt,
    );
    const tokenHash = await this.encryptionService.hashPassword(refreshToken);

    await this.authSessionsService.create({
      id: sessionId,
      userId: user!.id,
      tokenHash,
      expiresAt,
      userAgent: meta.userAgent,
    });

    this.logEvent('log', 'auth.signin.success', meta, {
      userId: user!.id,
      sessionId,
    });

    return {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt: expiresAt,
      message: ResponseMessages.User.SuccessAuthorization,
    };
  }

  async refreshTokens(
    refreshToken: string,
    meta: AuthRequestMeta = {},
  ): Promise<IRefreshResponse> {
    const verification =
      await this.tokenService.verifyRefreshToken(refreshToken);

    if (verification.status === 'expired') {
      this.logEvent('warn', 'auth.refresh.terminal', meta, {
        code: RefreshErrorCode.REFRESH_TOKEN_EXPIRED,
      });
      throw new RefreshTerminalException(
        RefreshErrorCode.REFRESH_TOKEN_EXPIRED,
        ResponseMessages.Auth.RefreshTokenExpired,
      );
    }

    if (verification.status === 'invalid') {
      this.logEvent('warn', 'auth.refresh.terminal', meta, {
        code: RefreshErrorCode.REFRESH_TOKEN_INVALID,
      });
      throw new RefreshTerminalException(
        RefreshErrorCode.REFRESH_TOKEN_INVALID,
        ResponseMessages.Auth.RefreshTokenInvalid,
      );
    }

    const { payload } = verification;

    try {
      if (!payload.sid) {
        return await this.legacyRefresh(payload.sub, refreshToken, meta);
      }
      return await this.sessionRefresh(
        payload.sub,
        payload.sid,
        refreshToken,
        meta,
      );
    } catch (error) {
      if (error instanceof RefreshTerminalException) throw error;

      this.logEvent('error', 'auth.refresh.infra_failure', meta, {
        userId: payload.sub,
        message: error instanceof Error ? error.message : 'unknown error',
      });
      throw new AuthServiceUnavailableException(
        ResponseMessages.Auth.ServiceUnavailable,
      );
    }
  }

  private async sessionRefresh(
    userId: string,
    sessionId: string,
    presentedToken: string,
    meta: AuthRequestMeta,
  ): Promise<IRefreshResponse> {
    const user = await this.usersService.findByIdForAuth(userId);
    if (!user) {
      this.logEvent('warn', 'auth.refresh.terminal', meta, {
        userId,
        sessionId,
        code: RefreshErrorCode.SESSION_NOT_FOUND,
      });
      throw new RefreshTerminalException(
        RefreshErrorCode.SESSION_NOT_FOUND,
        ResponseMessages.Auth.SessionNotFound,
      );
    }

    // Rotation never extends a session's absolute lifetime: the new JWT's
    // `exp` (and later the cookie's expiry) is capped to the session's
    // existing expiresAt rather than restarting the full configured TTL.
    // If the session cannot be read here, verifyAndRotate below will still
    // produce the correct terminal outcome and this token is discarded.
    const existingSession =
      await this.authSessionsService.findActive(sessionId);

    const newAccessToken = await this.tokenService.generateAccessToken(user);
    const newRefreshToken = await this.tokenService.generateSessionRefreshToken(
      user,
      sessionId,
      existingSession?.expiresAt,
    );
    const newTokenHash =
      await this.encryptionService.hashPassword(newRefreshToken);

    const result = await this.authSessionsService.verifyAndRotate(
      sessionId,
      presentedToken,
      newTokenHash,
    );

    switch (result.outcome) {
      case 'not_found':
        this.logEvent('warn', 'auth.refresh.terminal', meta, {
          userId,
          sessionId,
          code: RefreshErrorCode.SESSION_NOT_FOUND,
        });
        throw new RefreshTerminalException(
          RefreshErrorCode.SESSION_NOT_FOUND,
          ResponseMessages.Auth.SessionNotFound,
        );
      case 'revoked':
        this.logEvent('warn', 'auth.refresh.terminal', meta, {
          userId,
          sessionId,
          code: RefreshErrorCode.SESSION_REVOKED,
        });
        throw new RefreshTerminalException(
          RefreshErrorCode.SESSION_REVOKED,
          ResponseMessages.Auth.SessionRevoked,
        );
      case 'expired':
        this.logEvent('warn', 'auth.refresh.terminal', meta, {
          userId,
          sessionId,
          code: RefreshErrorCode.SESSION_EXPIRED,
        });
        throw new RefreshTerminalException(
          RefreshErrorCode.SESSION_EXPIRED,
          ResponseMessages.Auth.SessionExpired,
        );
      case 'replayed':
        this.logEvent('warn', 'auth.refresh.terminal', meta, {
          userId,
          sessionId,
          code: RefreshErrorCode.REFRESH_REPLAYED,
        });
        throw new RefreshTerminalException(
          RefreshErrorCode.REFRESH_REPLAYED,
          ResponseMessages.Auth.RefreshReplayed,
        );
      case 'accepted_previous':
        this.logEvent('log', 'auth.refresh.success', meta, {
          userId,
          sessionId,
          outcome: 'accepted_previous',
        });
        return { accessToken: newAccessToken };
      case 'rotated':
        this.logEvent('log', 'auth.refresh.success', meta, {
          userId,
          sessionId,
          outcome: 'rotated',
        });
        return {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          refreshTokenExpiresAt: result.session.expiresAt,
        };
    }
  }

  /**
   * Upgrades a legacy (pre-session) refresh credential to a new session-bound
   * one. Runs as a single transaction: the user row is locked, the presented
   * token is re-validated against the locked hash, and — only for the
   * winner — the legacy hash is cleared and the new session is created in
   * the same commit. A concurrent loser observes the hash already cleared
   * (or a mismatch) and gets the legacy terminal failure; it can never also
   * upgrade the same credential into a second session.
   */
  private async legacyRefresh(
    userId: string,
    presentedToken: string,
    meta: AuthRequestMeta,
  ): Promise<IRefreshResponse> {
    const expiresAt = await this.sessionExpiresAt();

    const result = await this.dataSource.transaction(
      async (manager: EntityManager) => {
        const lockedUser = await this.usersService.lockForLegacyRefreshUpgrade(
          manager,
          userId,
        );

        if (!lockedUser || !lockedUser.hashedRefreshToken) {
          return { outcome: 'invalid' as const };
        }

        const tokenMatches = await this.encryptionService.validatePassword(
          lockedUser.hashedRefreshToken,
          presentedToken,
        );

        if (!tokenMatches) {
          return { outcome: 'invalid' as const };
        }

        const sessionId = uuidv7();
        const accessToken =
          await this.tokenService.generateAccessToken(lockedUser);
        const refreshToken =
          await this.tokenService.generateSessionRefreshToken(
            lockedUser,
            sessionId,
            expiresAt,
          );
        const tokenHash =
          await this.encryptionService.hashPassword(refreshToken);

        await this.usersService.clearRefreshTokenWithManager(
          manager,
          lockedUser.id,
        );
        await this.authSessionsService.create(
          {
            id: sessionId,
            userId: lockedUser.id,
            tokenHash,
            expiresAt,
            userAgent: meta.userAgent,
          },
          manager,
        );

        return {
          outcome: 'upgraded' as const,
          accessToken,
          refreshToken,
          sessionId,
        };
      },
    );

    if (result.outcome === 'invalid') {
      this.logEvent('warn', 'auth.refresh.terminal', meta, {
        userId,
        code: RefreshErrorCode.REFRESH_TOKEN_INVALID,
        legacy: true,
      });
      throw new RefreshTerminalException(
        RefreshErrorCode.REFRESH_TOKEN_INVALID,
        ResponseMessages.Auth.RefreshTokenInvalid,
        true,
      );
    }

    this.logEvent('log', 'auth.refresh.legacy_upgrade', meta, {
      userId,
      sessionId: result.sessionId,
    });

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      refreshTokenExpiresAt: expiresAt,
    };
  }

  async logout(
    refreshToken: string | null,
    meta: AuthRequestMeta = {},
  ): Promise<IAuthResponse> {
    if (!refreshToken) {
      this.logEvent('log', 'auth.logout', meta, { outcome: 'no_cookie' });
      return { message: ResponseMessages.User.SuccessLogout };
    }

    const payload = await this.tokenService.decodeForLogout(refreshToken);

    try {
      if (payload?.sid) {
        await this.authSessionsService.revokeCurrent(payload.sid);
        this.logEvent('log', 'auth.logout', meta, {
          userId: payload.sub,
          sessionId: payload.sid,
          outcome: 'session_revoked',
        });
      } else if (payload?.sub) {
        // No `sid`: this is either a legacy token or an already-superseded
        // one. `decodeForLogout` only checks the signature (and ignores
        // expiration), so a stale/replaced legacy token from another
        // device could still decode successfully. Only clear the shared
        // legacy hash if this exact token is still the one on file;
        // otherwise it may belong to a different, already-rotated device
        // and must not erase that device's current credential.
        const user = await this.usersService.findByIdForAuth(payload.sub);
        const stillCurrent =
          !!user?.hashedRefreshToken &&
          (await this.encryptionService.validatePassword(
            user.hashedRefreshToken,
            refreshToken,
          ));

        if (stillCurrent) {
          await this.usersService.updateRefreshToken(payload.sub, null);
          this.logEvent('log', 'auth.logout', meta, {
            userId: payload.sub,
            outcome: 'legacy_hash_cleared',
          });
        } else {
          this.logEvent('log', 'auth.logout', meta, {
            userId: payload.sub,
            outcome: 'no_session_to_revoke',
          });
        }
      } else {
        this.logEvent('log', 'auth.logout', meta, {
          outcome: 'no_session_to_revoke',
        });
      }
    } catch (error) {
      this.logEvent('error', 'auth.logout.infra_failure', meta, {
        userId: payload?.sub,
        sessionId: payload?.sid,
        message: error instanceof Error ? error.message : 'unknown error',
      });
      // The caller (controller) still expires the cookie regardless of this
      // failure; the session revocation/legacy-clear itself could not be
      // confirmed, so report it as a transient infrastructure failure.
      throw new AuthServiceUnavailableException(
        ResponseMessages.Auth.ServiceUnavailable,
      );
    }

    return { message: ResponseMessages.User.SuccessLogout };
  }
}
