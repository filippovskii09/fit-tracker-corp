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

import type { InternalAxiosRequestConfig } from 'axios';

import { redirectTo } from '@utils';
import { API_ENDPOINTS, APP_ROUTES, WORKOUTS_CACHE_KEY } from '@constants';
import { api } from '../api';

const mockedApi = api as unknown as jest.MockedFunction<
  (config: InternalAxiosRequestConfig) => Promise<unknown>
> & {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let errorInterceptor: (error: any) => Promise<unknown>;

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

    describe('Token Refresh Logic', () => {
      it('should try to refresh token on 401 error', async () => {
        const newToken = 'new-access-token';
        mockedApi.post.mockResolvedValue({ data: { accessToken: newToken } });

        const originalRequest = {
          headers: { Authorization: 'old-token' },
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
        expect(originalRequest.headers.Authorization).toBe(
          `Bearer ${newToken}`,
        );
        expect(mockedApi).toHaveBeenCalledWith(originalRequest);
      });

      it('should logout and redirect if refresh request itself fails with 401', async () => {
        localStorage.setItem('accessToken', 'old-token');
        localStorage.setItem(WORKOUTS_CACHE_KEY, '[]');

        const error = {
          response: { status: 401 },
          config: { _retry: false, url: API_ENDPOINTS.AUTH.REFRESH },
        };

        await expect(errorInterceptor(error)).rejects.toEqual(error);

        expect(mockedApi.post).not.toHaveBeenCalled();
        expect(localStorage.getItem('accessToken')).toBeNull();
        expect(localStorage.getItem(WORKOUTS_CACHE_KEY)).toBeNull();
        expect(redirectTo).toHaveBeenCalledWith(APP_ROUTES.AUTH.SIGNIN);
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

    describe('Concurrent Requests & Queue', () => {
      it('should queue multiple requests and resolve them all after one refresh', async () => {
        const newToken = 'queued-token';
        mockedApi.post.mockResolvedValueOnce({
          data: { accessToken: newToken },
        });
        (mockedApi as unknown as jest.Mock).mockResolvedValue('retry-success');

        const req1 = { headers: { Authorization: 'old' }, _retry: false };
        const req2 = { headers: { Authorization: 'old' }, _retry: false };
        const req3 = { headers: { Authorization: 'old' }, _retry: false };

        const error1 = { response: { status: 401 }, config: req1 };
        const error2 = { response: { status: 401 }, config: req2 };
        const error3 = { response: { status: 401 }, config: req3 };

        const p1 = errorInterceptor(error1);
        const p2 = errorInterceptor(error2);
        const p3 = errorInterceptor(error3);

        await Promise.all([p1, p2, p3]);

        expect(mockedApi.post).toHaveBeenCalledTimes(1);
        expect(mockedApi.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.REFRESH);

        expect(req1.headers.Authorization).toBe(`Bearer ${newToken}`);
        expect(req2.headers.Authorization).toBe(`Bearer ${newToken}`);
        expect(req3.headers.Authorization).toBe(`Bearer ${newToken}`);

        expect(mockedApi).toHaveBeenCalledTimes(3);
      });

      it('should reject queued requests if refresh fails', async () => {
        const refreshError = new Error('Network Error');
        mockedApi.post.mockRejectedValueOnce(refreshError);

        const req1 = { _retry: false };
        const req2 = { _retry: false };

        const p1 = errorInterceptor({
          response: { status: 401 },
          config: req1,
        });
        const p2 = errorInterceptor({
          response: { status: 401 },
          config: req2,
        });

        await expect(p1).rejects.toThrow('Network Error');
        await expect(p2).rejects.toThrow('Network Error');

        expect(mockedApi.post).toHaveBeenCalledTimes(1);
        expect(redirectTo).toHaveBeenCalledWith(APP_ROUTES.AUTH.SIGNIN);
      });
    });

    describe('Edge Cases', () => {
      it('should clear session and reject if request was already retried', async () => {
        localStorage.setItem('accessToken', 'old-token');
        localStorage.setItem(WORKOUTS_CACHE_KEY, '[]');
        const error = {
          response: { status: 401 },
          config: { _retry: true },
        };

        await expect(errorInterceptor(error)).rejects.toEqual(error);

        expect(mockedApi.post).not.toHaveBeenCalled();
        expect(localStorage.getItem('accessToken')).toBeNull();
        expect(localStorage.getItem(WORKOUTS_CACHE_KEY)).toBeNull();
        expect(redirectTo).toHaveBeenCalledWith(APP_ROUTES.AUTH.SIGNIN);
      });

      it('should reject if error has no config or response', async () => {
        const errorNoConfig = { response: { status: 401 } };
        await expect(errorInterceptor(errorNoConfig)).rejects.toEqual(
          errorNoConfig,
        );

        const errorNoResponse = { config: { _retry: false } };
        await expect(errorInterceptor(errorNoResponse)).rejects.toEqual(
          errorNoResponse,
        );
      });
    });
  });
});
