import { api } from '@api';
import { API_ENDPOINTS } from '@constants';
import { mockExercisesResponse } from '@mocks';
import { exercisesService } from '../exercises.service';

jest.mock('@api', () => ({
  api: {
    get: jest.fn(),
  },
}));

describe('ExercisesService', () => {
  const mockedApi = api as jest.Mocked<typeof api>;
  const mockedGet = mockedApi.get as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllExercises', () => {
    it('should call api.get with correct URL and return exercises data', async () => {
      mockedGet.mockResolvedValue({
        data: mockExercisesResponse,
      });

      const result = await exercisesService.getAllExercises();

      expect(mockedGet).toHaveBeenCalledWith(API_ENDPOINTS.EXERCISES.ROOT);
      expect(result).toEqual(mockExercisesResponse);
    });
  });
});
