import { render, screen, userEvent } from '@testUtils';
import { WEEK_DAYS } from '../../constants';
import {
  CALENDAR_MONTH_INDEX,
  CALENDAR_YEAR,
  CURRENT_DAY,
  EMPTY_DAY,
  WORKOUT_DAY,
  workoutPreview,
} from './fixtures';
import { CalendarGrid } from '../CalendarGrid';

describe('CalendarGrid', () => {
  const mockOpenModal = jest.fn();
  const mockSelectDate = jest.fn();
  const mockCheckWorkoutInThisDay = jest.fn(
    (day: number) => day === WORKOUT_DAY,
  );
  const mockGetWorkoutByDay = jest.fn((day: number) =>
    day === WORKOUT_DAY ? workoutPreview : undefined,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render week days and month days', () => {
    const days = [1, CURRENT_DAY, WORKOUT_DAY];

    render(
      <CalendarGrid
        arrayByDaysInMonth={days}
        indexOfFirstDayInMonth={3}
        currentDay={CURRENT_DAY}
        checkWorkoutInThisDay={mockCheckWorkoutInThisDay}
        openModalByClickOnDayCell={mockOpenModal}
        getWorkoutByDay={mockGetWorkoutByDay}
        onSelectDate={mockSelectDate}
        year={CALENDAR_YEAR}
        monthIndex={CALENDAR_MONTH_INDEX}
      />,
      {},
    );

    WEEK_DAYS.forEach((day) => {
      expect(screen.getByText(day.slice(0, 3))).toBeInTheDocument();
    });
    expect(screen.getAllByRole('button')).toHaveLength(days.length);
    expect(
      screen.getByRole('button', {
        name: String(CURRENT_DAY),
        pressed: true,
      }),
    ).toBeInTheDocument();
    expect(mockCheckWorkoutInThisDay).toHaveBeenCalledTimes(days.length);
    expect(mockGetWorkoutByDay).toHaveBeenCalledTimes(days.length);
  });

  it('should render no day cells when days are missing', () => {
    render(
      <CalendarGrid
        arrayByDaysInMonth={undefined as unknown as number[]}
        indexOfFirstDayInMonth={3}
        currentDay={CURRENT_DAY}
        checkWorkoutInThisDay={mockCheckWorkoutInThisDay}
        openModalByClickOnDayCell={mockOpenModal}
        getWorkoutByDay={mockGetWorkoutByDay}
        onSelectDate={mockSelectDate}
        year={CALENDAR_YEAR}
        monthIndex={CALENDAR_MONTH_INDEX}
      />,
      {},
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should pass selected date callback to day cells', async () => {
    const user = userEvent.setup();

    render(
      <CalendarGrid
        arrayByDaysInMonth={[EMPTY_DAY]}
        indexOfFirstDayInMonth={3}
        currentDay={CURRENT_DAY}
        checkWorkoutInThisDay={mockCheckWorkoutInThisDay}
        openModalByClickOnDayCell={mockOpenModal}
        getWorkoutByDay={mockGetWorkoutByDay}
        onSelectDate={mockSelectDate}
        year={CALENDAR_YEAR}
        monthIndex={CALENDAR_MONTH_INDEX}
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
  });
});
