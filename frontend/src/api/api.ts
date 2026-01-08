import axios from 'axios';

import { config } from '@config';
import { API_ENDPOINTS, APP_ROUTES } from '@constants';
import { redirectTo } from '@utils';

export const api = axios.create({
  baseURL: config.api.baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalReq = error.config;

    if (error.response.status === 401 && !originalReq._retry) {
      originalReq._retry = true;
      try {
        const { data } = await api.post(API_ENDPOINTS.AUTH.REFRESH);
        localStorage.setItem('accessToken', data.accessToken);
        originalReq.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalReq);
      } catch (error) {
        localStorage.removeItem('accessToken');
        redirectTo(APP_ROUTES.AUTH.SIGNIN);
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);
