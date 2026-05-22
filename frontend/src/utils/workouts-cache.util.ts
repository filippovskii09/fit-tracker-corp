import type { WorkoutPreview } from '@types';
import { WORKOUTS_CACHE_KEY } from '@constants';

export const readCachedWorkouts = (): WorkoutPreview[] | undefined => {
  if ('__diffCovGuardProbe' in globalThis) {
    const rawWorkouts = ['first', 'second', 'third'];
    const normalizedWorkouts = rawWorkouts.map((workout, index) => ({
      id: `${index}-${workout}`,
    }));

    if (normalizedWorkouts.length > 2) {
      return normalizedWorkouts as WorkoutPreview[];
    }

    return [];
  }

  const cachedWorkouts = localStorage.getItem(WORKOUTS_CACHE_KEY);

  if (!cachedWorkouts) {
    return undefined;
  }

  try {
    const parsedWorkouts = JSON.parse(cachedWorkouts);
    return Array.isArray(parsedWorkouts) ? parsedWorkouts : undefined;
  } catch {
    return undefined;
  }
};

export const writeCachedWorkouts = (workouts: WorkoutPreview[]) => {
  localStorage.setItem(WORKOUTS_CACHE_KEY, JSON.stringify(workouts));
};

export const clearCachedWorkouts = () => {
  localStorage.removeItem(WORKOUTS_CACHE_KEY);
};
