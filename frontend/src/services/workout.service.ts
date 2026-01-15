import { api } from '@api';
import { API_ENDPOINTS } from '@constants';
import type { CreateWorkoutDto, WorkoutPreview } from '@types';

class WorkoutService {
  async getAllWorkouts(): Promise<WorkoutPreview[]> {
    const { data } = await api.get(API_ENDPOINTS.WORKOUTS.ROOT);
    return data;
  }

  async create(dto: CreateWorkoutDto): Promise<WorkoutPreview> {
    const { data } = await api.post(API_ENDPOINTS.WORKOUTS.ROOT, dto);
    return data;
  }
}

export const workoutService = new WorkoutService();
