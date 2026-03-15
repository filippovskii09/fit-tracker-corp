import { api } from '@api';
import { API_ENDPOINTS } from '@constants';
import { mockWorkoutResponse } from '@mocks';
import { workoutService } from '../workout.service';

jest.mock('@api', () => ({
  api: {
    get: jest.fn(),
  },
}));

describe('WorkoutService', () => {
  const mockedApi = api as jest.Mocked<typeof api>;
  const mockedGet = mockedApi.get as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllWorkouts', () => {
    it('should call api.get with correct URL and return workout data', async () => {
      mockedGet.mockResolvedValue({
        data: mockWorkoutResponse,
      });

      const result = await workoutService.getAllWorkouts();

      expect(mockedGet).toHaveBeenCalledWith(API_ENDPOINTS.WORKOUTS.ROOT);
      expect(result).toEqual(mockWorkoutResponse);
    });
  });
});
