import { useMutation } from '@tanstack/react-query';

import type { RegisterDto, RegisterResponse } from '@types';
import { authService } from '@services';

export const useRegister = () => {
  return useMutation<RegisterResponse, Error, RegisterDto>({
    mutationFn: (data) => authService.register(data),
  });
};
