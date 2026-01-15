import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@constants';
import { exercisesService } from '@services';
import type { ExercisesResponse } from '@types';

export const useGetAllExercises = () => {
  return useQuery<ExercisesResponse[], Error>({
    queryKey: [QUERY_KEYS.EXERCISES],
    queryFn: () => exercisesService.getAllExercises(),
    retry: false,
    staleTime: 1000 * 60 * 60,
  });
};
