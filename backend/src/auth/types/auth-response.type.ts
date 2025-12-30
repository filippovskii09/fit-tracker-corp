export interface IAuthResponse {
  message: string;
}

export interface ITokens {
  accessToken: string;
  refreshToken: string;
}

export interface ISigninResponse extends IAuthResponse, ITokens {}

export type IRefreshResponse = ITokens;
