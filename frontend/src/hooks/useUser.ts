import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@constants';
import { profileService } from '@services';

export const useUser = () => {
  const token = localStorage.getItem('accessToken');

  return useQuery({
    queryKey: [QUERY_KEYS.USER],
    queryFn: () => profileService.getMe(),
    enabled: !!token,
    retry: false,
  });
};
