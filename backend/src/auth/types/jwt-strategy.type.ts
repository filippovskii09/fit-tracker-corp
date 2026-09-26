export interface JwtPayload {
  sub: string;
  email: string;
  /** Absent on tokens issued before this claim existed (compatibility window). */
  tokenUse?: 'access';
}
