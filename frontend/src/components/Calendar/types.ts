import type { WorkoutPreview } from '@types';

export interface ICalendarProps {
  workouts: WorkoutPreview[];
}

export interface IMounthSwitcherProps {
  prevMonth: () => void;
  nextMonth: () => void;
  month: string;
  year: number;
}

export interface ICalendarGridProps {
  arrayByDaysInMonth: number[];
  indexOfFirstDayInMonth: number;
  currentDay: number;
  checkWorkoutInThisDay: (day: number) => boolean;
}

export interface ICalendarActionsProps {
  backToday: () => void;
}
