import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { config } from '@config';
import { API_ENDPOINTS, APP_ROUTES } from '@constants';
import { clearCachedWorkouts, redirectTo } from '@utils';

interface FailedRequest {
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
}

export const api = axios.create({
  baseURL: config.api.baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const clearSessionAndRedirect = () => {
  localStorage.removeItem('accessToken');
  clearCachedWorkouts();
  redirectTo(APP_ROUTES.AUTH.SIGNIN);
};

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalReq = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalReq || !error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    const isRefreshRequest = originalReq.url?.includes(
      API_ENDPOINTS.AUTH.REFRESH,
    );

    if (isRefreshRequest) {
      processQueue(error as Error, null);
      isRefreshing = false;
      clearSessionAndRedirect();
      return Promise.reject(error);
    }

    if (originalReq._retry) {
      clearSessionAndRedirect();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalReq.headers) {
            originalReq.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalReq);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    originalReq._retry = true;
    isRefreshing = true;

    try {
      const { data } = await api.post(API_ENDPOINTS.AUTH.REFRESH);

      const newToken = data.accessToken;
      localStorage.setItem('accessToken', newToken);

      if (originalReq.headers) {
        originalReq.headers.Authorization = `Bearer ${newToken}`;
      }

      processQueue(null, newToken);

      return api(originalReq);
    } catch (refreshError) {
      processQueue(refreshError as Error, null);
      clearSessionAndRedirect();

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
