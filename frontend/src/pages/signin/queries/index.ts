import { useMutation } from '@tanstack/react-query';

import type { SigninDto, SigninResponse } from '@types';
import { authService } from '@services';

export const useSignin = () => {
  return useMutation<SigninResponse, Error, SigninDto>({
    mutationFn: (data) => authService.signin(data),
  });
};
