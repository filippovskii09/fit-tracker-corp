import { WORKOUTS_CACHE_KEY } from '@constants';
import {
  clearCachedWorkouts,
  readCachedWorkouts,
  writeCachedWorkouts,
} from '../workouts-cache.util';

describe('workouts cache utils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should read and write cached workouts', () => {
    const workouts = [
      {
        id: 'workout-1',
        name: 'Push day',
        date: '2026-04-11',
        status: 'COMPLETED',
      },
    ];

    writeCachedWorkouts(workouts);

    expect(readCachedWorkouts()).toEqual(workouts);
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
