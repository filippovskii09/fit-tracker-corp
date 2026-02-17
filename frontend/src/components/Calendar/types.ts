import type { SelectDate, WorkoutPreview } from '@types';

export interface ICalendarProps {
  workouts: WorkoutPreview[];
  openModalByClickOnDayCell: () => void;
  onSelectDate: ({ year, monthIndex, day }: SelectDate) => void;
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
  onSelectDate: ({ year, monthIndex, day }: SelectDate) => void;
  year: number;
  monthIndex: number;
}

export interface ICalendarActionsProps {
  backToday: () => void;
}

export interface ICalendarDayCellProps {
  day: number;
  year: number;
  monthIndex: number;
  isCurrent: boolean;
  hasWorkout: boolean;
  colStart: number;
  isFirstDay: boolean;
  openModalByClickOnDayCell: () => void;
  initialWorkoutId?: string;
  onSelectDate: ({ year, monthIndex, day }: SelectDate) => void;
}

export interface ICalendarDayCellPointProps {
  pointClasses: string;
}
