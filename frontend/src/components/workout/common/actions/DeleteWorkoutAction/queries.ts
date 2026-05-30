import { useQueryClient, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { QUERY_KEYS, APP_ROUTES } from '@constants';
import { DICTIONARY } from '@locales';
import { workoutService } from '@services';
import type { RemoveWorkoutResponse } from '@types';

export const useRemoveWorkout = (id: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { remove } = DICTIONARY.workout;

  return useMutation<RemoveWorkoutResponse, Error, void>({
    mutationFn: () => workoutService.removeWorkout(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.WORKOUTS],
        refetchType: 'all',
      });
      navigate(APP_ROUTES.DASHBOARD);
      toast.success(remove.success);
    },
    onError: () => {
      toast.error(remove.error);
    },
  });
};
