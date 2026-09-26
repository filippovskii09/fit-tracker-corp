jest.mock('@config', () => ({
  config: {
    api: {
      baseURL: 'http://test-api.com',
    },
  },
}));

jest.mock('@services/session', () => ({
  coordinateRefresh: jest.fn(),
  getAccessToken: jest.fn(),
  handleTerminalSessionFailure: jest.fn(),
}));

import type { InternalAxiosRequestConfig } from 'axios';

import { API_ENDPOINTS } from '@constants';
import {
  coordinateRefresh,
  getAccessToken,
  handleTerminalSessionFailure,
} from '@services/session';
import { api } from '../api';

const mockedApi = api as unknown as jest.MockedFunction<
  (config: InternalAxiosRequestConfig) => Promise<unknown>
> & {
  interceptors: {
    request: { use: jest.Mock };
    response: { use: jest.Mock };
  };
};

const mockedCoordinateRefresh = coordinateRefresh as jest.Mock;
const mockedGetAccessToken = getAccessToken as jest.Mock;
const mockedHandleTerminalSessionFailure =
  handleTerminalSessionFailure as jest.Mock;

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
  });

  describe('Request Interceptor', () => {
    it('should add Authorization header if a token is present', () => {
      mockedGetAccessToken.mockReturnValue('test-token');
      const config = { headers: {} };

      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBe('Bearer test-token');
    });

    it('should NOT add Authorization header if no token', () => {
      mockedGetAccessToken.mockReturnValue(null);
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
      expect(mockedCoordinateRefresh).not.toHaveBeenCalled();
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

    it('should not coordinate refresh for a 401 on the refresh endpoint itself', async () => {
      const error = {
        response: { status: 401 },
        config: { _retry: false, url: API_ENDPOINTS.AUTH.REFRESH },
      };

      await expect(errorInterceptor(error)).rejects.toEqual(error);
      expect(mockedCoordinateRefresh).not.toHaveBeenCalled();
    });

    it('should not coordinate refresh for a 401 on the logout endpoint itself', async () => {
      const error = {
        response: { status: 401 },
        config: { _retry: false, url: API_ENDPOINTS.AUTH.LOGOUT },
      };

      await expect(errorInterceptor(error)).rejects.toEqual(error);
      expect(mockedCoordinateRefresh).not.toHaveBeenCalled();
    });

    it('should not coordinate refresh for a 401 on the sign-in endpoint (orchestrator decision)', async () => {
      const error = {
        response: { status: 401 },
        config: { _retry: false, url: API_ENDPOINTS.AUTH.SIGNIN },
      };

      await expect(errorInterceptor(error)).rejects.toEqual(error);
      expect(mockedCoordinateRefresh).not.toHaveBeenCalled();
    });

    it('should not coordinate refresh for a 401 on the register endpoint (orchestrator decision)', async () => {
      const error = {
        response: { status: 401 },
        config: { _retry: false, url: API_ENDPOINTS.AUTH.REGISTER },
      };

      await expect(errorInterceptor(error)).rejects.toEqual(error);
      expect(mockedCoordinateRefresh).not.toHaveBeenCalled();
    });

    it('should reject without retrying again if the request was already retried once', async () => {
      const error = {
        response: { status: 401 },
        config: { _retry: true },
      };

      await expect(errorInterceptor(error)).rejects.toEqual(error);
      expect(mockedCoordinateRefresh).not.toHaveBeenCalled();
    });

    describe('unexpected 401 on a protected request', () => {
      it('retries the original request exactly once after a successful coordinated refresh', async () => {
        mockedCoordinateRefresh.mockResolvedValue({
          status: 'success',
          accessToken: 'new-access-token',
        });
        (mockedApi as unknown as jest.Mock).mockResolvedValue('retry-success');

        const originalRequest = {
          headers: { Authorization: 'old-token' },
          _retry: false,
        };
        const error = { response: { status: 401 }, config: originalRequest };

        const result = await errorInterceptor(error);

        expect(mockedCoordinateRefresh).toHaveBeenCalledTimes(1);
        expect(originalRequest.headers.Authorization).toBe(
          'Bearer new-access-token',
        );
        expect(originalRequest._retry).toBe(true);
        expect(mockedApi).toHaveBeenCalledWith(originalRequest);
        expect(result).toBe('retry-success');
        expect(mockedHandleTerminalSessionFailure).not.toHaveBeenCalled();
      });

      it('clears the session on a terminal outcome and rejects', async () => {
        mockedCoordinateRefresh.mockResolvedValue({
          status: 'terminal',
          code: 'SESSION_REVOKED',
        });

        const originalRequest = { headers: {}, _retry: false };
        const error = { response: { status: 401 }, config: originalRequest };

        await expect(errorInterceptor(error)).rejects.toEqual(error);

        expect(mockedHandleTerminalSessionFailure).toHaveBeenCalledTimes(1);
        expect(mockedApi).not.toHaveBeenCalled();
      });

      it('keeps the session intact and rejects (no logout) on a transient outcome', async () => {
        mockedCoordinateRefresh.mockResolvedValue({
          status: 'transient',
          reason: 'server_error',
        });

        const originalRequest = { headers: {}, _retry: false };
        const error = { response: { status: 401 }, config: originalRequest };

        await expect(errorInterceptor(error)).rejects.toEqual(error);

        expect(mockedHandleTerminalSessionFailure).not.toHaveBeenCalled();
        expect(mockedApi).not.toHaveBeenCalled();
      });
    });
  });
});
