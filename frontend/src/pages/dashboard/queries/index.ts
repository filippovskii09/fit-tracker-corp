import { useQuery } from '@tanstack/react-query';

import type { WorkoutPreview } from '@types';
import { workoutService } from '@services';
import { QUERY_KEYS } from '@constants';

export const useGetWorkouts = () => {
  return useQuery<WorkoutPreview[], Error>({
    queryKey: [QUERY_KEYS.WORKOUTS],
    queryFn: () => workoutService.getAllWorkouts(),
    retry: false,
  });
};
