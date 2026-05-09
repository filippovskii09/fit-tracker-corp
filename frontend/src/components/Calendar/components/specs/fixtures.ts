import type { WorkoutPreview } from '@types';

export const CALENDAR_YEAR = 2026;
export const CALENDAR_MONTH_INDEX = 4;
export const CURRENT_DAY = 2;
export const WORKOUT_DAY = 3;
export const EMPTY_DAY = 4;
export const WORKOUT_ID = 'workout-1';

export const workoutPreview: WorkoutPreview = {
  id: WORKOUT_ID,
  name: 'Push workout',
  date: '2026-05-03',
  status: 'completed',
};
