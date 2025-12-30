export interface IAuthResponse {
  message: string;
}

export interface ISigninResponse extends IAuthResponse {
  accessToken: string;
}
