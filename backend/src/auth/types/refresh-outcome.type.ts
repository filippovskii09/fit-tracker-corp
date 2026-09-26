export enum RefreshErrorCode {
  REFRESH_COOKIE_MISSING = 'REFRESH_COOKIE_MISSING',
  REFRESH_TOKEN_EXPIRED = 'REFRESH_TOKEN_EXPIRED',
  REFRESH_TOKEN_INVALID = 'REFRESH_TOKEN_INVALID',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_REVOKED = 'SESSION_REVOKED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  REFRESH_REPLAYED = 'REFRESH_REPLAYED',
  REFRESH_RATE_LIMITED = 'REFRESH_RATE_LIMITED',
}

export const AUTH_SERVICE_UNAVAILABLE_CODE = 'AUTH_SERVICE_UNAVAILABLE';

export interface IRefreshTerminalErrorBody {
  statusCode: 401;
  error: 'Unauthorized';
  message: string;
  code: RefreshErrorCode;
}

export interface IRefreshRateLimitedBody {
  statusCode: 429;
  message: string;
  code: RefreshErrorCode.REFRESH_RATE_LIMITED;
  retryAfterSeconds: number;
}

export interface IAuthServiceUnavailableBody {
  statusCode: 503;
  message: string;
  code: typeof AUTH_SERVICE_UNAVAILABLE_CODE;
}
