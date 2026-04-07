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

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseParams.mockReturnValue({ id: mockId });
  });

  it('should show notFound message if workout data not loaded or undefined', () => {
    mockUseGetWorkoutById.mockReturnValue({ data: null });

    render(<ViewWorkoutPage />, { route: `/workout/${mockId}` });

    expect(
      screen.getByText(DICTIONARY.workout.view.notFound),
    ).toBeInTheDocument();
  });

  it('should render header with workout name if data loaded', () => {
    const mockData = {
      name: 'Push Up Session',
      date: '2023-10-27T00:00:00.000Z',
      exercises: [],
    };
    mockUseGetWorkoutById.mockReturnValue({ data: mockData });

    render(<ViewWorkoutPage />, { route: `/workout/${mockId}` });

    expect(screen.getByDisplayValue(mockData.name)).toBeInTheDocument();
  });
});
