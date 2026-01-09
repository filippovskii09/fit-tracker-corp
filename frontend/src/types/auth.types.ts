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
