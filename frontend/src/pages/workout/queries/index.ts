import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CreateWorkoutDto, WorkoutPreview, IWorkout } from '@types';
import { QUERY_KEYS } from '@constants';
import { workoutService } from '@services';

export const useGetWorkoutById = (id: string) => {
  return useQuery<IWorkout, Error>({
    queryKey: [QUERY_KEYS.WORKOUTS, id],
    queryFn: () => workoutService.getWorkoutById(id),
    retry: false,
  });
};

export const useCreateWorkoutQ = () => {
  const queryClient = useQueryClient();
  return useMutation<WorkoutPreview, Error, CreateWorkoutDto>({
    mutationFn: (data) => workoutService.create(data),
    onSuccess: async () => {
      try {
        // Refetch failure must not turn a confirmed create into a failed
        // save (design.md D7, task 7.5): the mutation is already a success.
        await queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.WORKOUTS],
          refetchType: 'all',
        });
      } catch {
        // Swallowed intentionally; see comment above.
      }
    },
  });
};
