import { API_ENDPOINTS } from '@constants';
import { api } from '@api';
import { authService } from '../auth.service';

jest.mock('@api', () => ({
  api: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

describe('AuthService', () => {
  const mockedApi = api as jest.Mocked<typeof api>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call api.post with correct URL and DTO, then return data', async () => {
      const mockDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
      };

      const mockResponse = {
        accessToken: 'fake-token',
        user: { id: 1, email: 'test@example.com' },
      };

      (mockedApi.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await authService.register(mockDto);

      expect(mockedApi.post).toHaveBeenCalledWith(
        API_ENDPOINTS.AUTH.REGISTER,
        mockDto,
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('signin', () => {
    it('should call api.post with correct URL and DTO', async () => {
      const mockDto = {
        email: 'user@example.com',
        password: 'secretPassword',
      };

      const mockResponse = {
        accessToken: 'login-token',
        user: { id: 2, email: 'user@example.com' },
      };

      (mockedApi.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await authService.signin(mockDto);

      expect(mockedApi.post).toHaveBeenCalledWith(
        API_ENDPOINTS.AUTH.SIGNIN,
        mockDto,
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
