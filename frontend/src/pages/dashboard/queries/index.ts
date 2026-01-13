import { useQuery } from '@tanstack/react-query';

import type { WorkoutsResponse } from '@types';
import { workoutService } from '@services';
import { QUERY_KEYS } from '@constants';

export const useGetWorkouts = () => {
  return useQuery<WorkoutsResponse, Error>({
    queryKey: [QUERY_KEYS.WORKOUTS],
    queryFn: () => workoutService.getAllWorkouts(),
  });
};
