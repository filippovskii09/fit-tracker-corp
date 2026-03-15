import { renderHook, waitFor } from '@testUtils';
import { workoutService } from '@services';
import { mockWorkoutResponse } from '@mocks';
import { WORKOUT_STATUS } from '@constants';
import { useGetWorkoutById, useCreateWorkoutQ } from '../queries';

jest.mock('@services', () => ({
  workoutService: {
    getWorkoutById: jest.fn(),
    create: jest.fn(),
  },
}));

describe('Workout Queries', () => {
  const mockedWorkoutService = workoutService as jest.Mocked<
    typeof workoutService
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useGetWorkoutById', () => {
    it('should fetch workout with correct ID and return data', async () => {
      const mockId = 'id-example';
      mockedWorkoutService.getWorkoutById.mockResolvedValue(
        mockWorkoutResponse[0],
      );

      const { result } = renderHook(() => useGetWorkoutById(mockId));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedWorkoutService.getWorkoutById).toHaveBeenCalledWith(mockId);
      expect(result.current.data).toEqual(mockWorkoutResponse[0]);
    });
  });

  describe('useCreateWorkoutQ', () => {
    it('should call workoutService.create on mutate and invalidate queries', async () => {
      const mockDto = { name: 'New Workout', date: 'some-date', exercises: [] };
      mockedWorkoutService.create.mockResolvedValue({
        id: 'new-id',
        ...mockDto,
        status: WORKOUT_STATUS.PENDING,
      });

      const { result } = renderHook(() => useCreateWorkoutQ());

      result.current.mutate(mockDto);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedWorkoutService.create).toHaveBeenCalledWith(mockDto);
    });
  });
});
