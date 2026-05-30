import { act } from '@testing-library/react';
import { useParams } from 'react-router-dom';

import { renderHook } from '@testUtils';
import { useRemoveWorkout } from '../queries';
import { useDeleteWorkoutAction } from '../hooks';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

jest.mock('../queries', () => ({
  useRemoveWorkout: jest.fn(),
}));

describe('useDeleteWorkoutAction', () => {
  const workoutId = 'workout-1';
  const mockRemoveWorkout = jest.fn();

  const mockedUseParams = useParams as jest.Mock;
  const mockedUseRemoveWorkout = useRemoveWorkout as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseParams.mockReturnValue({ id: workoutId });
    mockedUseRemoveWorkout.mockReturnValue({
      mutateAsync: mockRemoveWorkout,
      isPending: false,
    });
  });

  it('should initialize delete modal as closed and pass route workout id to remove mutation', () => {
    const { result } = renderHook(() => useDeleteWorkoutAction());

    expect(result.current.isDeleteWorkoutModalOpen).toBe(false);
    expect(result.current.isRemovingWorkout).toBe(false);
    expect(mockedUseRemoveWorkout).toHaveBeenCalledWith(workoutId);
  });

  it('should open and close delete workout modal', () => {
    const { result } = renderHook(() => useDeleteWorkoutAction());

    act(() => {
      result.current.openDeleteWorkoutModal();
    });

    expect(result.current.isDeleteWorkoutModalOpen).toBe(true);

    act(() => {
      result.current.closeDeleteWorkoutModal();
    });

    expect(result.current.isDeleteWorkoutModalOpen).toBe(false);
  });

  it('should close delete modal before confirming workout deletion', async () => {
    mockRemoveWorkout.mockResolvedValue({ deleted: true });

    const { result } = renderHook(() => useDeleteWorkoutAction());

    act(() => {
      result.current.openDeleteWorkoutModal();
    });

    expect(result.current.isDeleteWorkoutModalOpen).toBe(true);

    await act(async () => {
      await result.current.confirmWorkoutDeleting();
    });

    expect(result.current.isDeleteWorkoutModalOpen).toBe(false);
    expect(mockRemoveWorkout).toHaveBeenCalledTimes(1);
  });

  it('should expose pending remove state from remove mutation', () => {
    mockedUseRemoveWorkout.mockReturnValue({
      mutateAsync: mockRemoveWorkout,
      isPending: true,
    });

    const { result } = renderHook(() => useDeleteWorkoutAction());

    expect(result.current.isRemovingWorkout).toBe(true);
  });
});
