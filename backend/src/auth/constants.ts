import { ResponseMessages } from '@src/common/messages';
import { IAuthResponse } from './types';

export const registerResponse: IAuthResponse = {
  message: ResponseMessages.User.SuccessRegistration,
} as const;

/** Bounded overlap during which the immediately-previous refresh token is
 * still accepted (without rotating again) to tolerate tab/request races. */
export const REFRESH_TOKEN_OVERLAP_MS = 10_000;

export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';
export const REFRESH_TOKEN_COOKIE_PATH = '/api/v1/auth';
export const LEGACY_REFRESH_TOKEN_COOKIE_PATH = '/';
