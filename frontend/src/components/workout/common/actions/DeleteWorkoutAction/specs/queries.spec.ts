import { QueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { APP_ROUTES, QUERY_KEYS } from '@constants';
import { DICTIONARY } from '@locales';
import { workoutService } from '@services';
import { renderHook, waitFor } from '@testUtils';
import { useRemoveWorkout } from '../queries';

jest.mock('@services', () => ({
  workoutService: {
    removeWorkout: jest.fn(),
  },
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

describe('useRemoveWorkout', () => {
  const workoutId = 'workout-1';
  const mockNavigate = jest.fn();
  const removeLocales = DICTIONARY.workout.remove;

  const mockedWorkoutService = workoutService as jest.Mocked<
    typeof workoutService
  >;
  const mockedNavigate = useNavigate as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedNavigate.mockReturnValue(mockNavigate);
  });

  it('should remove workout, invalidate workouts, navigate to dashboard, and show success toast', async () => {
    const invalidateQueriesSpy = jest.spyOn(
      QueryClient.prototype,
      'invalidateQueries',
    );

    mockedWorkoutService.removeWorkout.mockResolvedValue({ deleted: true });

    const { result } = renderHook(() => useRemoveWorkout(workoutId));

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedWorkoutService.removeWorkout).toHaveBeenCalledWith(workoutId);
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.WORKOUTS],
      refetchType: 'all',
    });
    expect(mockNavigate).toHaveBeenCalledWith(APP_ROUTES.DASHBOARD);
    expect(toast.success).toHaveBeenCalledWith(removeLocales.success);
  });

  it('should show error toast when workout removing fails', async () => {
    mockedWorkoutService.removeWorkout.mockRejectedValue(new Error('Failed'));

    const { result } = renderHook(() => useRemoveWorkout(workoutId));

    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockedWorkoutService.removeWorkout).toHaveBeenCalledWith(workoutId);
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(removeLocales.error);
  });
});
