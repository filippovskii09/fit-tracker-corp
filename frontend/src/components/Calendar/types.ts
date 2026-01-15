import type { WorkoutPreview } from '@types';

export interface ICalendarProps {
  workouts: WorkoutPreview[];
  openModalByClickOnDayCell: () => void;
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
  openModalByClickOnDayCell: () => void;
  getWorkoutByDay: (day: number) => WorkoutPreview | undefined;
}

export interface ICalendarActionsProps {
  backToday: () => void;
}

export interface ICalendarDayCellProps {
  day: number;
  isCurrent: boolean;
  hasWorkout: boolean;
  colStart: number;
  isFirstDay: boolean;
  openModalByClickOnDayCell: () => void;
  initialWorkoutId?: string;
}

export interface ICalendarDayCellPointProps {
  pointClasses: string;
}
