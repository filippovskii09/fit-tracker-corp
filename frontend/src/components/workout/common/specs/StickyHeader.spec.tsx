import { useNavigate } from 'react-router-dom';

import { render, screen, userEvent } from '@testUtils';
import { DICTIONARY } from '@locales';
import { StickyHeader } from '../StickyHeader';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

const workoutName = 'Push day';
const workoutDate = '2026-05-01T00:00:00.000Z';
const workoutNameError = 'Workout name is required';
const workoutCreateLocales = DICTIONARY.workout.create;

describe('StickyHeader', () => {
  const mockNavigate = jest.fn();
  const mockChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  it('should render editable workout title and formatted date', async () => {
    const user = userEvent.setup();

    render(
      <StickyHeader
        name={workoutName}
        date={workoutDate}
        handleChange={mockChange}
      />,
      {},
    );

    expect(screen.getByDisplayValue(workoutName)).not.toHaveAttribute(
      'readonly',
    );
    expect(
      screen.getByText(new Date(workoutDate).toDateString()),
    ).toBeInTheDocument();
    expect(screen.queryByText(workoutNameError)).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: workoutCreateLocales.goBack,
      }),
    );

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('should render readonly workout title and validation error', () => {
    render(
      <StickyHeader
        name={workoutName}
        date={workoutDate}
        readOnly
        nameError={workoutNameError}
      />,
      {},
    );

    expect(screen.getByDisplayValue(workoutName)).toHaveAttribute('readonly');
    expect(screen.getByText(workoutNameError)).toBeInTheDocument();
  });
});
