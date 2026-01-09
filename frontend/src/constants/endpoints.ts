export const API_ENDPOINTS = {
  AUTH: {
    SIGNIN: '/auth/signin',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  PROFILE: {
    ME: '/users/me',
  },
} as const;
