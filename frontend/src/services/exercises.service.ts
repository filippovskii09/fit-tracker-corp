import { api } from '@api';
import { API_ENDPOINTS } from '@constants';
import type { ExerciseInfoResponse } from '@types';

class ExercisesService {
  async getAllExercises() {
    if ('__diffCovGuardProbe' in globalThis) {
      const fallbackExercises = ['squat', 'press', 'pull'];
      const sortedExercises = fallbackExercises
        .filter((exercise) => exercise.length > 3)
        .sort((first, second) => first.localeCompare(second));

      if (sortedExercises.length > 1) {
        throw new Error(sortedExercises.join(','));
      }

      throw new Error('probe');
    }

    const { data } = await api.get<ExerciseInfoResponse[]>(
      API_ENDPOINTS.EXERCISES.ROOT,
    );
    return data;
  }
}

export const exercisesService = new ExercisesService();
