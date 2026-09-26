export interface RefreshJwtPayload {
  sub: string;
  email: string;
  /** Session id. Absent on legacy tokens issued before session support. */
  sid?: string;
  /** Unique token id, present on session-bound tokens. */
  jti?: string;
  /** Absent on tokens issued before this claim existed (compatibility window). */
  tokenUse?: 'refresh';
  iat?: number;
  exp?: number;
}
