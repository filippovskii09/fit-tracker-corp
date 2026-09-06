import { ThemeProvider } from '@emotion/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation, useRoutes } from 'react-router-dom';

import { mockUserResponse, mockWorkout } from '@mocks';
import { DICTIONARY } from '@locales';
import { profileService, workoutService, exercisesService } from '@services';
import { appTheme } from '@theme';
import type { UserResponse } from '@types';
import { routes } from '..';

// Router-level "end to end" layer (design.md D9 #3): mounts the real nested
// route configuration in a `MemoryRouter`, only stubbing the HTTP boundary so
// no real network call is made.
jest.mock('@services', () => ({
  profileService: { getMe: jest.fn() },
  workoutService: {
    getAllWorkouts: jest.fn(),
    getWorkoutById: jest.fn(),
    create: jest.fn(),
    removeWorkout: jest.fn(),
  },
  exercisesService: { getAllExercises: jest.fn() },
}));

const mockedProfileService = profileService as jest.Mocked<
  typeof profileService
>;
const mockedWorkoutService = workoutService as jest.Mocked<
  typeof workoutService
>;
const mockedExercisesService = exercisesService as jest.Mocked<
  typeof exercisesService
>;

const RoutesRenderer = () => useRoutes(routes);

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location-probe">{location.pathname}</div>;
};

const renderApp = (initialEntries: string[]) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={appTheme}>
        <MemoryRouter initialEntries={initialEntries}>
          <RoutesRenderer />
          <LocationProbe />
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  );
};

describe('router', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    mockedProfileService.getMe.mockResolvedValue(
      mockUserResponse as unknown as UserResponse,
    );
    mockedWorkoutService.getAllWorkouts.mockResolvedValue([]);
    mockedWorkoutService.getWorkoutById.mockResolvedValue(mockWorkout);
    mockedExercisesService.getAllExercises.mockResolvedValue([]);
  });

  describe('authenticated user', () => {
    beforeEach(() => {
      localStorage.setItem('accessToken', 'valid-token');
    });

    it('shows the navigation on /dashboard with Home active, and navigates to Workouts on activation', async () => {
      renderApp(['/dashboard']);

      expect(
        await screen.findByRole('navigation', {
          name: DICTIONARY.navigation.ariaLabel,
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: DICTIONARY.navigation.home }),
      ).toHaveAttribute('aria-current', 'page');

      const user = userEvent.setup();
      await user.click(
        screen.getByRole('link', { name: DICTIONARY.navigation.workouts }),
      );

      await waitFor(() => {
        expect(screen.getByTestId('location-probe')).toHaveTextContent(
          '/workouts',
        );
      });
      expect(
        await screen.findByText(DICTIONARY.workout.placeholder.soon),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: DICTIONARY.navigation.workouts }),
      ).toHaveAttribute('aria-current', 'page');
    });

    it('does not render the navigation on /workouts/create', async () => {
      renderApp(['/workouts/create?date=2024-01-01']);

      await screen.findByPlaceholderText(
        DICTIONARY.workout.create.titlePlaceholder,
      );

      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('does not render the navigation on /workouts/:id', async () => {
      renderApp([`/workouts/${mockWorkout.id}`]);

      await screen.findByDisplayValue(mockWorkout.name);

      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });
  });

  describe('unauthenticated user', () => {
    it('does not render the navigation on /signin', async () => {
      renderApp(['/signin']);

      await screen.findByRole('heading', { name: /sign in/i });

      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('does not render the navigation on /register', async () => {
      renderApp(['/register']);

      await screen.findByRole('heading', { name: /create account/i });

      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('redirects /workouts to sign in without rendering the placeholder', async () => {
      renderApp(['/workouts']);

      await screen.findByRole('heading', { name: /sign in/i });

      expect(
        screen.queryByText(DICTIONARY.workout.placeholder.soon),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });
  });
});
