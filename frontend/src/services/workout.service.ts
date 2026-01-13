import { api } from '@api';
import { API_ENDPOINTS } from '@constants';
import type { WorkoutsResponse } from '@types';

class WorkoutService {
  async getAllWorkouts(): Promise<WorkoutsResponse> {
    const { data } = await api.get(API_ENDPOINTS.WORKOUTS.ROOT);
    return data;
  }
}

export const workoutService = new WorkoutService();
