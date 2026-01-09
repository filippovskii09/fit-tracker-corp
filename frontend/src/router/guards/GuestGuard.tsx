import { Navigate, Outlet } from 'react-router-dom';

import { APP_ROUTES } from '@constants';

export const GuestGuard = () => {
  const token = localStorage.getItem('accessToken');

  if (token) {
    return <Navigate to={APP_ROUTES.ROOT} replace />;
  }

  return <Outlet />;
};
