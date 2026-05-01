import { act, renderHook } from '@testUtils';
import { MONTH_NAMES } from '../constants';
import { useCalendar } from '../hooks';
import {
  CURRENT_MONTH_WORKOUT_DAY,
  NEXT_MONTH_WORKOUT_DAY,
  TODAY,
  currentMonthWorkout,
  nextMonthWorkout,
} from './fixtures';

describe('useCalendar', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(TODAY);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return current month metadata and workouts', () => {
    const { result } = renderHook(() =>
      useCalendar([currentMonthWorkout, nextMonthWorkout]),
    );

    expect(result.current.month).toBe(MONTH_NAMES[TODAY.getMonth()]);
    expect(result.current.year).toBe(TODAY.getFullYear());
    expect(result.current.monthIndex).toBe(TODAY.getMonth());
    expect(result.current.currentDay).toBe(TODAY.getDate());
    expect(result.current.arrayByDaysInMonth).toHaveLength(31);
    expect(result.current.indexOfFirstDayInMonth).toBe(6);
    expect(
      result.current.checkWorkoutInThisDay(CURRENT_MONTH_WORKOUT_DAY),
    ).toBe(true);
    expect(result.current.getWorkoutByDay(CURRENT_MONTH_WORKOUT_DAY)).toBe(
      currentMonthWorkout,
    );
    expect(result.current.checkWorkoutInThisDay(NEXT_MONTH_WORKOUT_DAY)).toBe(
      false,
    );
  });

  it('should navigate between months and return back to today', () => {
    const { result } = renderHook(() =>
      useCalendar([currentMonthWorkout, nextMonthWorkout]),
    );

    act(() => {
      result.current.nextMonth();
    });

    expect(result.current.month).toBe(MONTH_NAMES[5]);
    expect(result.current.monthIndex).toBe(5);
    expect(result.current.currentDay).toBeNaN();
    expect(result.current.arrayByDaysInMonth).toHaveLength(30);
    expect(result.current.checkWorkoutInThisDay(NEXT_MONTH_WORKOUT_DAY)).toBe(
      true,
    );
    expect(result.current.getWorkoutByDay(NEXT_MONTH_WORKOUT_DAY)).toBe(
      nextMonthWorkout,
    );

    act(() => {
      result.current.prevMonth();
    });

    expect(result.current.month).toBe(MONTH_NAMES[TODAY.getMonth()]);
    expect(result.current.currentDay).toBe(TODAY.getDate());

    act(() => {
      result.current.prevMonth();
    });

    expect(result.current.month).toBe(MONTH_NAMES[3]);
    expect(result.current.currentDay).toBeNaN();

    act(() => {
      result.current.backToday();
    });

    expect(result.current.month).toBe(MONTH_NAMES[TODAY.getMonth()]);
    expect(result.current.currentDay).toBe(TODAY.getDate());
  });
});
