import { Navigate, Outlet } from 'react-router-dom';

import { APP_ROUTES } from '@constants';
import { useUser } from '@hooks';

export const PrivateGuard = () => {
  const token = localStorage.getItem('accessToken');

  useUser();

  if (!token) {
    return <Navigate to={APP_ROUTES.AUTH.SIGNIN} replace />;
  }

  return <Outlet />;
};
