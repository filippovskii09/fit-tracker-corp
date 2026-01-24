import { Navigate, Outlet } from 'react-router-dom';

import { APP_ROUTES } from '@constants';
import { useUser } from '@hooks';
import { Loader } from '@components';

export const PrivateGuard = () => {
  const { data: user, isLoading, isError } = useUser();
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return <Navigate to={APP_ROUTES.AUTH.SIGNIN} replace />;
  }

  if (isLoading) {
    return <Loader />;
  }

  if (isError || !user) {
    return <Navigate to={APP_ROUTES.AUTH.SIGNIN} replace />;
  }

  return <Outlet />;
};
