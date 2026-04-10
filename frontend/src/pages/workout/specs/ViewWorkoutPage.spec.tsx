import { useParams } from 'react-router-dom';

import { DICTIONARY } from '@locales';
import { render, screen } from '@testUtils';

import { useGetWorkoutById } from '../queries';
import ViewWorkoutPage from '../view/ViewWorkoutPage';

jest.mock('../queries', () => ({
  useGetWorkoutById: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

describe('ViewWorkoutPage', () => {
  const mockUseGetWorkoutById = useGetWorkoutById as jest.Mock;
  const mockedUseParams = useParams as jest.Mock;
  const mockId = 'id-example';
  // TODO: extract shared workout route test helper if this file gets another URL variant.

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseParams.mockReturnValue({ id: mockId });
  });

  it('should show skeleton while workout is loading for the first time', () => {
    mockUseGetWorkoutById.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    render(<ViewWorkoutPage />, { route: `/workout/${mockId}` });

    expect(screen.getByTestId('workout-details-skeleton')).toBeInTheDocument();
  });

  it('should show notFound message only when request returns 404', () => {
    mockUseGetWorkoutById.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: {
        isAxiosError: true,
        response: { status: 404 },
      },
    });

    render(<ViewWorkoutPage />, { route: `/workout/${mockId}` });

    expect(
      screen.getByText(DICTIONARY.workout.view.notFound),
    ).toBeInTheDocument();
  });

  it('should show distinct error state for non-404 errors', () => {
    mockUseGetWorkoutById.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: {
        response: { status: 500 },
      },
    });

    render(<ViewWorkoutPage />, { route: `/workout/${mockId}` });

    expect(screen.getByText(DICTIONARY.workout.view.error)).toBeInTheDocument();
  });

  it('should render header with workout name if data loaded', () => {
    const mockData = {
      name: 'Push Up Session',
      date: '2023-10-27T00:00:00.000Z',
      exercises: [],
    };
    mockUseGetWorkoutById.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<ViewWorkoutPage />, { route: `/workout/${mockId}` });

    expect(screen.getByDisplayValue(mockData.name)).toBeInTheDocument();
  });
});
