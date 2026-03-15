import { api } from '@api';
import { API_ENDPOINTS } from '@constants';
import { mockUserResponse } from '@mocks';
import { profileService } from '../profile.service';

jest.mock('@api', () => ({
  api: {
    get: jest.fn(),
  },
}));

describe('ProfileService', () => {
  const mockedApi = api as jest.Mocked<typeof api>;
  const mockedGet = mockedApi.get as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMe', () => {
    it('should call api.get with correct URL and return user data', async () => {
      mockedGet.mockResolvedValue({
        data: mockUserResponse,
      });

      const result = await profileService.getMe();

      expect(mockedGet).toHaveBeenCalledWith(API_ENDPOINTS.PROFILE.ME);
      expect(result).toEqual(mockUserResponse);
    });
  });
});
