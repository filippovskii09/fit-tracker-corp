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
  WORKOUTS: {
    ROOT: '/workouts',
  },
  EXERCISES: {
    ROOT: '/exercises',
  },
} as const;
