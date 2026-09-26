export interface RegisterResponse {
  message: string;
}

export interface RegisterDto {
  firstName: string;
  email: string;
  password: string;
}

export interface SigninResponse {
  accessToken: string;
  message: string;
}

export interface SigninDto {
  email: string;
  password: string;
}

export interface LogoutResponse {
  message: string;
}

// One of REFRESH_ERROR_CODES (@constants) or 'UNKNOWN' for a malformed
// terminal response.
export type RefreshErrorCode =
  | 'REFRESH_COOKIE_MISSING'
  | 'REFRESH_TOKEN_EXPIRED'
  | 'REFRESH_TOKEN_INVALID'
  | 'SESSION_NOT_FOUND'
  | 'SESSION_REVOKED'
  | 'SESSION_EXPIRED'
  | 'REFRESH_REPLAYED'
  | 'UNKNOWN';

export interface RefreshSuccessResponse {
  accessToken: string;
}

export type TransientRefreshReason =
  | 'network'
  | 'rate_limited'
  | 'server_error'
  // Any status other than 401/403/429/5xx (e.g. 400/404/405/408), or a
  // malformed 200 refresh body : treated as
  // transient rather than terminal so a one-off unexpected response can't
  // log the user out.
  | 'unexpected_status';

// Structured outcome of a refresh attempt, shared by the interceptor and
// proactive session checks (design.md D4/D5).
export type SessionOutcome =
  | { status: 'success'; accessToken: string }
  | { status: 'terminal'; code: RefreshErrorCode }
  | {
      status: 'transient';
      reason: TransientRefreshReason;
      retryAfterSeconds?: number;
    };
