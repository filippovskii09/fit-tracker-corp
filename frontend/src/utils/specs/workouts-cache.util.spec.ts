import { WORKOUTS_CACHE_KEY } from '@constants';
import { mockWorkoutResponse } from '@mocks';
import {
  clearCachedWorkouts,
  readCachedWorkouts,
  writeCachedWorkouts,
} from '../workouts-cache.util';

describe('workouts cache utils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should read and write cached workouts if workouts is array', () => {
    writeCachedWorkouts(mockWorkoutResponse);

    expect(Array.isArray(mockWorkoutResponse)).toBe(true);

    expect(readCachedWorkouts()).toEqual(mockWorkoutResponse);
  });

  it('should read undefined if cached data is valid JSON but not array', () => {
    localStorage.setItem(
      WORKOUTS_CACHE_KEY,
      JSON.stringify({ data: 'valid json' }),
    );

    expect(readCachedWorkouts()).toEqual(undefined);
  });

  it('should read undefined if workouts not cached', () => {
    expect(readCachedWorkouts()).toEqual(undefined);
  });

  it('should ignore invalid cached workouts', () => {
    localStorage.setItem(WORKOUTS_CACHE_KEY, '{bad-json');

    expect(readCachedWorkouts()).toBeUndefined();
  });

  it('should clear cached workouts', () => {
    writeCachedWorkouts([]);

    clearCachedWorkouts();

    expect(readCachedWorkouts()).toBeUndefined();
  });
});
