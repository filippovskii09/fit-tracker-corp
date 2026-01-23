import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS, QUERY_STALE_TIME_DAY } from '@constants';
import { exercisesService } from '@services';
import type { ExerciseInfoResponse } from '@types';

export const useGetAllExercises = () => {
  return useQuery<ExerciseInfoResponse[], Error>({
    queryKey: [QUERY_KEYS.EXERCISES],
    queryFn: () => exercisesService.getAllExercises(),
    retry: false,
    // Exercises are not changing, so we can set staleTime to Infinity
    staleTime: Infinity,
    gcTime: QUERY_STALE_TIME_DAY,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};
