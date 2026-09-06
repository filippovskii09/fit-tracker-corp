import {
  createBrowserRouter,
  Navigate,
  type RouteObject,
} from 'react-router-dom';
import { lazy } from 'react';

import { AppLayout, AuthLayout } from '@layouts';
import { APP_ROUTES } from '@constants';
import { GuestGuard, PrivateGuard } from './guards';
import { LazyRoute } from './LazyRoute';
import { SEO } from './constant';

const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const CreateWorkoutPage = lazy(
  () => import('../pages/workout/create/CreateWorkoutPage'),
);
const RegisterPage = lazy(() => import('../pages/register/RegisterPage'));
const SigninPage = lazy(() => import('../pages/signin/SigninPage'));
const ViewWorkoutPage = lazy(
  () => import('../pages/workout/view/ViewWorkoutPage'),
);
const WorkoutsPlaceholderPage = lazy(
  () => import('../pages/workout/placeholder/WorkoutsPlaceholderPage'),
);

// Exported separately from `router` so tests can mount the exact same route
// configuration with `createMemoryRouter` instead of `createBrowserRouter`.
export const routes: RouteObject[] = [
  // PUBLIC ROUTES
  {
    element: <GuestGuard />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: APP_ROUTES.AUTH.REGISTER,
            element: (
              <LazyRoute
                component={RegisterPage}
                path={APP_ROUTES.AUTH.REGISTER}
                {...SEO.register}
              />
            ),
          },
          {
            path: APP_ROUTES.AUTH.SIGNIN,
            element: (
              <LazyRoute
                component={SigninPage}
                path={APP_ROUTES.AUTH.SIGNIN}
                {...SEO.signin}
              />
            ),
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
        element: <AppLayout />,
        children: [
          {
            path: APP_ROUTES.DASHBOARD,
            element: (
              <LazyRoute
                component={DashboardPage}
                path={APP_ROUTES.DASHBOARD}
                noIndex
                {...SEO.dashboard}
              />
            ),
          },
          {
            path: APP_ROUTES.WORKOUTS.ROOT,
            element: (
              <LazyRoute
                component={WorkoutsPlaceholderPage}
                path={APP_ROUTES.WORKOUTS.ROOT}
                noIndex
                {...SEO.workouts}
              />
            ),
          },
        ],
      },
      {
        path: APP_ROUTES.WORKOUTS.CREATE,
        element: (
          <LazyRoute
            component={CreateWorkoutPage}
            path={APP_ROUTES.WORKOUTS.CREATE}
            noIndex
            {...SEO.createWorkout}
          />
        ),
      },
      {
        path: `${APP_ROUTES.WORKOUTS.ROOT}/:id`,
        element: (
          <LazyRoute component={ViewWorkoutPage} noIndex {...SEO.viewWorkout} />
        ),
      },
    ],
  },

  // FALLBACK
  {
    path: '*',
    element: <Navigate to={APP_ROUTES.AUTH.SIGNIN} replace />,
  },
];

export const router = createBrowserRouter(routes);
