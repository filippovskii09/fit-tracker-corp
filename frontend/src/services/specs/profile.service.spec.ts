import { api } from '@api';
import { API_ENDPOINTS } from '@constants';
import { profileService } from '../profile.service';

jest.mock('@api', () => ({
  api: {
    get: jest.fn(),
  },
}));

describe('ProfileService', () => {
  const mockedApi = api as jest.Mocked<typeof api>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMe', () => {
    it('should call api.get with correct URL and return user data', async () => {
      const mockUserResponse = {
        id: 'user-123',
        email: 'artur@example.com',
        firstName: 'Artur',
        lastName: 'Dev',
      };

      (mockedApi.get as jest.Mock).mockResolvedValue({
        data: mockUserResponse,
      });

      const result = await profileService.getMe();

      expect(mockedApi.get).toHaveBeenCalledWith(API_ENDPOINTS.PROFILE.ME);
      expect(result).toEqual(mockUserResponse);
    });
  });
});
