import { useNavigate, useSearchParams } from 'react-router-dom';

import { APP_ROUTES } from '@constants';
import { render, screen } from '@testUtils';
import CreateWorkoutPage from '../create/CreateWorkoutPage';
import { useCreateWorkout } from '../create/hooks';

jest.mock('../create/hooks', () => ({
  useCreateWorkout: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useSearchParams: jest.fn(),
}));

describe('CreateWorkoutPage', () => {
  const mockNavigate = jest.fn();
  const mockHandleSubmit = jest.fn();

  const mockedNavigate = useNavigate as jest.Mock;
  const mockedUseCreateWorkout = useCreateWorkout as jest.Mock;
  const mockedUseSearchParams = useSearchParams as jest.Mock;

  const mockDate = '2023-10-27';
  const basePath = '/workout/create';

  beforeEach(() => {
    jest.clearAllMocks();
    mockedNavigate.mockReturnValue(mockNavigate);
    mockedUseCreateWorkout.mockReturnValue(mockHandleSubmit);
  });

  it('should navigate to dashboard if date is missing in searchParams', () => {
    mockedUseSearchParams.mockReturnValue([new URLSearchParams('')]);

    render(<CreateWorkoutPage />, { route: basePath });

    expect(mockNavigate).toHaveBeenCalledWith(APP_ROUTES.DASHBOARD);
  });

  it('should render Formik and submit correctly when button clicked', async () => {
    mockedUseSearchParams.mockReturnValue([
      new URLSearchParams(`?date=${mockDate}`),
    ]);

    render(<CreateWorkoutPage />, { route: `${basePath}?date=${mockDate}` });

    expect(
      screen.getByRole('button', { name: /Finish Workout/i }),
    ).toBeInTheDocument();
  });
});
