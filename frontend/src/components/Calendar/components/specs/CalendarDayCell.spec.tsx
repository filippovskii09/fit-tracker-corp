import { useNavigate } from 'react-router-dom';

import { render, screen, userEvent } from '@testUtils';
import { APP_ROUTES } from '@constants';
import {
  CALENDAR_MONTH_INDEX,
  CALENDAR_YEAR,
  CURRENT_DAY,
  EMPTY_DAY,
  WORKOUT_ID,
} from './fixtures';
import { CalendarDayCell } from '../CalendarDayCell';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('CalendarDayCell', () => {
  const mockNavigate = jest.fn();
  const mockOpenModal = jest.fn();
  const mockSelectDate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  it('should select date and open modal when day has no workout', async () => {
    const user = userEvent.setup();

    render(
      <CalendarDayCell
        day={EMPTY_DAY}
        year={CALENDAR_YEAR}
        monthIndex={CALENDAR_MONTH_INDEX}
        isCurrent={false}
        hasWorkout={false}
        colStart={1}
        isFirstDay={false}
        openModalByClickOnDayCell={mockOpenModal}
        onSelectDate={mockSelectDate}
      />,
      {},
    );

    await user.click(
      screen.getByRole('button', {
        name: String(EMPTY_DAY),
      }),
    );

    expect(mockSelectDate).toHaveBeenCalledWith({
      year: CALENDAR_YEAR,
      monthIndex: CALENDAR_MONTH_INDEX,
      day: EMPTY_DAY,
    });
    expect(mockOpenModal).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should navigate to workout when day has workout', async () => {
    const user = userEvent.setup();

    render(
      <CalendarDayCell
        day={CURRENT_DAY}
        year={CALENDAR_YEAR}
        monthIndex={CALENDAR_MONTH_INDEX}
        isCurrent
        hasWorkout
        colStart={3}
        isFirstDay
        initialWorkoutId={WORKOUT_ID}
        openModalByClickOnDayCell={mockOpenModal}
        onSelectDate={mockSelectDate}
      />,
      {},
    );

    const dayButton = screen.getByRole('button', {
      name: String(CURRENT_DAY),
      pressed: true,
    });

    await user.click(dayButton);

    expect(dayButton).toHaveAttribute('aria-pressed', 'true');
    expect(mockNavigate).toHaveBeenCalledWith(
      `${APP_ROUTES.WORKOUTS.ROOT}/${WORKOUT_ID}`,
    );
    expect(mockSelectDate).not.toHaveBeenCalled();
    expect(mockOpenModal).not.toHaveBeenCalled();
  });
});
