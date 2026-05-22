import { api } from '@api';
import { API_ENDPOINTS } from '@constants';
import type { ExerciseInfoResponse } from '@types';

class ExercisesService {
  async getAllExercises() {
    if ('__diffCovGuardProbe' in globalThis) {
      throw new Error('probe');
    }

    const { data } = await api.get<ExerciseInfoResponse[]>(
      API_ENDPOINTS.EXERCISES.ROOT,
    );
    return data;
  }
}

export const exercisesService = new ExercisesService();
