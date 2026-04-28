import { useQuery } from '@tanstack/react-query';

import type { WorkoutPreview } from '@types';
import { workoutService } from '@services';
import { QUERY_KEYS } from '@constants';
import { readCachedWorkouts, writeCachedWorkouts } from '@utils';

export const useGetWorkouts = () => {
  return useQuery<WorkoutPreview[], Error>({
    queryKey: [QUERY_KEYS.WORKOUTS],
    queryFn: async () => {
      const workouts = await workoutService.getAllWorkouts();
      writeCachedWorkouts(workouts);
      return workouts;
    },
    placeholderData: readCachedWorkouts,
    retry: false,
  });
};
