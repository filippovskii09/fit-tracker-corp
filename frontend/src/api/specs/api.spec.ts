jest.mock('@config', () => ({
  config: {
    api: {
      baseURL: 'http://test-api.com',
    },
  },
}));

jest.mock('@utils', () => ({
  ...jest.requireActual('@utils'),
  redirectTo: jest.fn(),
}));

import { redirectTo } from '@utils';
import { API_ENDPOINTS, APP_ROUTES } from '@constants';
import { api } from '../api';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockedApi = api as unknown as jest.MockedFunction<any> & {
  interceptors: {
    request: { use: jest.Mock };
    response: { use: jest.Mock };
  };
  post: jest.Mock;
};

describe('Axios Interceptors', () => {
  let requestInterceptor: (config: { headers: Record<string, string> }) => {
    headers: Record<string, string>;
  };
  let successInterceptor: (response: unknown) => unknown;
  let errorInterceptor: (error: {
    response?: { status: number };
    config?: { _retry?: boolean };
  }) => Promise<unknown>;

  beforeAll(() => {
    requestInterceptor = mockedApi.interceptors.request.use.mock.calls[0][0];
    successInterceptor = mockedApi.interceptors.response.use.mock.calls[0][0];
    errorInterceptor = mockedApi.interceptors.response.use.mock.calls[0][1];
  });

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Request Interceptor', () => {
    it('should add Authorization header if token exists', () => {
      localStorage.setItem('accessToken', 'test-token');
      const config = { headers: {} };

      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBe('Bearer test-token');
    });

    it('should NOT add Authorization header if no token', () => {
      const config = { headers: {} };
      const result = requestInterceptor(config);
      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('Response Interceptor', () => {
    it('should pass through successful responses', () => {
      const response = { data: 'ok' };
      expect(successInterceptor(response)).toEqual(response);
    });

    it('should reject errors other than 401', async () => {
      const error = { response: { status: 500 }, config: {} };
      await expect(errorInterceptor(error)).rejects.toEqual(error);
    });

    it('should try to refresh token on 401 error', async () => {
      const newToken = 'new-access-token';
      mockedApi.post.mockResolvedValue({ data: { accessToken: newToken } });

      const originalRequest = {
        headers: {
          Authorization: {},
        },
        _retry: false,
      };
      const error = {
        response: { status: 401 },
        config: originalRequest,
      };

      (mockedApi as unknown as jest.Mock).mockResolvedValue('success-retry');

      await errorInterceptor(error);

      expect(mockedApi.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.REFRESH);
      expect(localStorage.getItem('accessToken')).toBe(newToken);
      expect(originalRequest.headers.Authorization).toBe(`Bearer ${newToken}`);

      expect(mockedApi).toHaveBeenCalledWith(originalRequest);
    });

    it('should logout and redirect if refresh fails', async () => {
      mockedApi.post.mockRejectedValue(new Error('Refresh failed'));
      localStorage.setItem('accessToken', 'old-token');

      const error = {
        response: { status: 401 },
        config: { _retry: false },
      };

      await expect(errorInterceptor(error)).rejects.toThrow('Refresh failed');

      expect(localStorage.getItem('accessToken')).toBeNull();

      expect(redirectTo).toHaveBeenCalledWith(APP_ROUTES.AUTH.SIGNIN);
    });
  });
});
