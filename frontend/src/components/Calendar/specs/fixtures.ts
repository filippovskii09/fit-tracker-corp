import type { WorkoutPreview } from '@types';

export const TODAY = new Date('2026-05-15T12:00:00.000Z');
export const CURRENT_MONTH_WORKOUT_DAY = 10;
export const NEXT_MONTH_WORKOUT_DAY = 5;

export const currentMonthWorkout: WorkoutPreview = {
  id: 'current-month-workout',
  name: 'Current month workout',
  date: '2026-05-10T00:00:00.000Z',
  status: 'completed',
};

export const nextMonthWorkout: WorkoutPreview = {
  id: 'next-month-workout',
  name: 'Next month workout',
  date: '2026-06-05T00:00:00.000Z',
  status: 'planned',
};
