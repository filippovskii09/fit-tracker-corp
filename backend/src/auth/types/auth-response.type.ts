export interface IAuthResponse {
  message: string;
}

export interface ITokens {
  accessToken: string;
  refreshToken: string;
}

export interface ISigninResponse extends IAuthResponse, ITokens {
  /** Absolute expiry of the session/refresh cookie (no sliding extension). */
  refreshTokenExpiresAt: Date;
}

/**
 * `refreshToken` is only present when the refresh credential was rotated
 * (normal rotation or legacy upgrade). When the immediately-previous token
 * was accepted within the overlap window, only a fresh access token is
 * returned and the existing cookie is left untouched.
 */
export interface IRefreshResponse {
  accessToken: string;
  refreshToken?: string;
  /** Present whenever `refreshToken` is; the session's absolute expiresAt. */
  refreshTokenExpiresAt?: Date;
}
