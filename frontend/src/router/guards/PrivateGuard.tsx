import { Box, CircularProgress } from '@mui/material';
import { Navigate, Outlet } from 'react-router-dom';

import { APP_ROUTES } from '@constants';
import { useUser } from '@hooks';

export const PrivateGuard = () => {
  const { data: user, isLoading, isError } = useUser();
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return <Navigate to={APP_ROUTES.AUTH.SIGNIN} replace />;
  }

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (isError || !user) {
    return <Navigate to={APP_ROUTES.AUTH.SIGNIN} replace />;
  }

  return <Outlet />;
};
