import { api } from '@api';
import { API_ENDPOINTS } from '@constants';
import type { WorkoutPreview } from '@types';

class WorkoutService {
  async getAllWorkouts(): Promise<WorkoutPreview[]> {
    const { data } = await api.get(API_ENDPOINTS.WORKOUTS.ROOT);
    return data;
  }
}

export const workoutService = new WorkoutService();
