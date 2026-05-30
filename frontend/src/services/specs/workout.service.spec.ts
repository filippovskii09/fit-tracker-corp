import { api } from '@api';
import { API_ENDPOINTS } from '@constants';
import { mockWorkout, mockWorkoutResponse } from '@mocks';
import { workoutService } from '../workout.service';

jest.mock('@api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('WorkoutService', () => {
  const mockedApi = api as jest.Mocked<typeof api>;
  const mockedGet = mockedApi.get as jest.Mock;
  const mockedPost = mockedApi.post as jest.Mock;
  const mockedDelete = mockedApi.delete as jest.Mock;

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

  describe('create workout', () => {
    it('should call api.post with correct url and payload', async () => {
      mockedPost.mockResolvedValue({ data: mockWorkoutResponse });

      const result = await workoutService.create(mockWorkout);

      expect(mockedPost).toHaveBeenCalledWith(
        API_ENDPOINTS.WORKOUTS.ROOT,
        mockWorkout,
      );

      expect(result).toEqual(mockWorkoutResponse);
    });
  });

  describe('get workout by id', () => {
    it('should call api.get with correct url and return workout by id', async () => {
      mockedGet.mockResolvedValue({ data: mockWorkout });

      const workoutId = mockWorkout.id;

      const result = await workoutService.getWorkoutById(workoutId);

      expect(mockedGet).toHaveBeenCalledWith(
        `${API_ENDPOINTS.WORKOUTS.ROOT}/${workoutId}`,
      );

      expect(result).toEqual(mockWorkout);
    });
  });

  describe('remove workout by id', () => {
    it('should call api.delete with correct url', async () => {
      mockedDelete.mockResolvedValue({ data: { deleted: true } });

      const workoutId = mockWorkout.id;

      const result = await workoutService.removeWorkout(workoutId);

      expect(mockedDelete).toHaveBeenCalledWith(
        `${API_ENDPOINTS.WORKOUTS.ROOT}/${workoutId}`,
      );
      expect(result).toEqual({ deleted: true });
    });
  });
});
