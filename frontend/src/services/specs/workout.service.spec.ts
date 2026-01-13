import { api } from '@api';
import { API_ENDPOINTS } from '@constants';
import { workoutService } from '../workout.service';

jest.mock('@api', () => ({
  api: {
    get: jest.fn(),
  },
}));

describe('WorkoutService', () => {
  const mockedApi = api as jest.Mocked<typeof api>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllWorkouts', () => {
    it('should call api.get with correct URL and return workout data', async () => {
      const mockWorkoutResponse = [
        {
          id: 'id-example',
          name: 'Chest',
          date: 'date-example',
          status: 'COMPLETED',
        },
      ];

      (mockedApi.get as jest.Mock).mockResolvedValue({
        data: mockWorkoutResponse,
      });

      const result = await workoutService.getAllWorkouts();

      expect(mockedApi.get).toHaveBeenCalledWith(API_ENDPOINTS.WORKOUTS.ROOT);
      expect(result).toEqual(mockWorkoutResponse);
    });
  });
});
