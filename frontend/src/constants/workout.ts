export const WORKOUT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type WorkoutStatus =
  (typeof WORKOUT_STATUS)[keyof typeof WORKOUT_STATUS];

export const WORKOUTS_CACHE_KEY = 'fit-tracker:workouts';
