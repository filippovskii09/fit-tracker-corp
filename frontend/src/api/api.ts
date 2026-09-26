import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { config } from '@config';
import { API_ENDPOINTS } from '@constants';
// Imported from the `session` subpath (not the `@services` barrel) to avoid
// a module cycle: the barrel also re-exports services that import `@api`.
import {
  coordinateRefresh,
  getAccessToken,
  handleTerminalSessionFailure,
} from '@services/session';

export const api = axios.create({
  baseURL: config.api.baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((requestConfig) => {
  const token = getAccessToken();
  if (token && requestConfig.headers) {
    requestConfig.headers.Authorization = `Bearer ${token}`;
  }
  return requestConfig;
});

// Response-interceptor fallback for an unexpected 401 (design.md D4/D5). The
// coordinator itself performs the network refresh and cross-tab
// coordination (task 6.1); this interceptor only classifies the outcome for
// exactly one retry (task 6.5) and never replays the request more than once.
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalReq = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalReq || !error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    // A 401 on a public credential-submission route (wrong password, bad
    // registration credentials) is a normal form-validation outcome, not an
    // expired session — never try to refresh/retry it.
    const isCredentialSubmissionRequest =
      originalReq.url?.includes(API_ENDPOINTS.AUTH.SIGNIN) ||
      originalReq.url?.includes(API_ENDPOINTS.AUTH.REGISTER);

    const isRefreshOrLogoutRequest =
      originalReq.url?.includes(API_ENDPOINTS.AUTH.REFRESH) ||
      originalReq.url?.includes(API_ENDPOINTS.AUTH.LOGOUT);

    if (
      isRefreshOrLogoutRequest ||
      isCredentialSubmissionRequest ||
      originalReq._retry
    ) {
      return Promise.reject(error);
    }

    originalReq._retry = true;

    const outcome = await coordinateRefresh();

    if (outcome.status === 'success') {
      if (originalReq.headers) {
        originalReq.headers.Authorization = `Bearer ${outcome.accessToken}`;
      }
      return api(originalReq);
    }

    if (outcome.status === 'terminal') {
      handleTerminalSessionFailure();
    }

    // Transient (network/429/5xx): keep session state and route intact and
    // let the caller decide whether/how to retry the original operation.
    return Promise.reject(error);
  },
);
