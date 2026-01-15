import { api } from '@api';
import { API_ENDPOINTS } from '@constants';
import type { ExercisesResponse } from '@types';

class ExercisesService {
  async getAllExercises() {
    const { data } = await api.get<ExercisesResponse[]>(
      API_ENDPOINTS.EXERCISES.ROOT,
    );
    return data;
  }
}

export const exercisesService = new ExercisesService();
