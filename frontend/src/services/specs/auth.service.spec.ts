import { API_ENDPOINTS } from '@constants';
import { api } from '@api';
import { mockAuthResponse, mockRegisterDto, mockSigninDto } from '@mocks';
import { authService } from '../auth.service';

jest.mock('@api', () => ({
  api: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

describe('AuthService', () => {
  const mockedApi = api as jest.Mocked<typeof api>;
  const mockedPost = mockedApi.post as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call api.post with correct URL and DTO, then return data', async () => {
      mockedPost.mockResolvedValue({ data: mockAuthResponse });

      const result = await authService.register(mockRegisterDto);

      expect(mockedPost).toHaveBeenCalledWith(
        API_ENDPOINTS.AUTH.REGISTER,
        mockRegisterDto,
      );

      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('signin', () => {
    it('should call api.post with correct URL and DTO', async () => {
      mockedPost.mockResolvedValue({ data: mockAuthResponse });

      const result = await authService.signin(mockSigninDto);

      expect(mockedPost).toHaveBeenCalledWith(
        API_ENDPOINTS.AUTH.SIGNIN,
        mockSigninDto,
      );
      expect(result).toEqual(mockAuthResponse);
    });
  });
});
