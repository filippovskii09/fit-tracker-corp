export const WORKOUT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type WorkoutStatus =
  (typeof WORKOUT_STATUS)[keyof typeof WORKOUT_STATUS];

export const WORKOUTS_CACHE_KEY = 'fit-tracker:workouts';

// Client-side mirror of the backend create-workout DTO bounds, as confirmed
// by the backend implementer: name maxLength 100, exercises/sets per
// exercise arrayMaxSize 50, weight/reps max 1000.
export const WORKOUT_NAME_MAX_LENGTH = 100;
export const WORKOUT_MAX_EXERCISES = 50;
export const WORKOUT_MAX_SETS_PER_EXERCISE = 50;
export const WORKOUT_SET_VALUE_MAX = 1000;
