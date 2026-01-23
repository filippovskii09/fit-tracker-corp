import { useQuery } from '@tanstack/react-query';

import type { IWorkout } from '@types';
import { QUERY_KEYS } from '@constants';
import { workoutService } from '@services';

export const useGetWorkoutById = (id: string) => {
  return useQuery<IWorkout, Error>({
    queryKey: [QUERY_KEYS.WORKOUTS, id],
    queryFn: () => workoutService.getWorkoutById(id),
    retry: false,
  });
};
