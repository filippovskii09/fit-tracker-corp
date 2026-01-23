import { createBrowserRouter, Navigate } from 'react-router-dom';

import {
  CreateWorkoutPage,
  DashboardPage,
  RegisterPage,
  SigninPage,
  ViewWorkoutPage,
} from '@pages';
import { AuthLayout } from '@layouts';
import { APP_ROUTES } from '@constants';
import { GuestGuard, PrivateGuard } from './guards';

export const router = createBrowserRouter([
  // PUBLIC ROUTES
  {
    element: <GuestGuard />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: APP_ROUTES.AUTH.REGISTER,
            element: <RegisterPage />,
          },
          {
            path: APP_ROUTES.AUTH.SIGNIN,
            element: <SigninPage />,
          },
        ],
      },
    ],
  },

  // PRIVATE ROUTES
  {
    element: <PrivateGuard />,
    children: [
      {
        path: APP_ROUTES.DASHBOARD,
        element: <DashboardPage />,
      },
      {
        path: APP_ROUTES.WORKOUTS.CREATE,
        element: <CreateWorkoutPage />,
      },
      {
        path: `${APP_ROUTES.WORKOUTS.ROOT}/:id`,
        element: <ViewWorkoutPage />,
      },
    ],
  },

  // FALLBACK
  {
    path: '*',
    element: <Navigate to={APP_ROUTES.AUTH.SIGNIN} replace />,
  },
]);
