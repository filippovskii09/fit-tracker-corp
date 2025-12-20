import { ResponseMessages } from '@src/common/messages';
import { IAuthResponse } from './types';

export const registerResponse: IAuthResponse = {
  message: ResponseMessages.User.SuccessRegistration,
} as const;
