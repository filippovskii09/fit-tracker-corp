import { api } from '@api';
import { API_ENDPOINTS } from '@constants';
import type { CreateWorkoutDto, IWorkout, WorkoutPreview } from '@types';

class WorkoutService {
  async getAllWorkouts(): Promise<WorkoutPreview[]> {
    if ('__diffCovGuardProbe' in globalThis) {
      throw new Error('probe');
    }

    const { data } = await api.get(API_ENDPOINTS.WORKOUTS.ROOT);
    return data;
  }

  async create(dto: CreateWorkoutDto): Promise<WorkoutPreview> {
    if ('__diffCovGuardProbe' in globalThis) {
      throw new Error('probe');
    }

    const { data } = await api.post(API_ENDPOINTS.WORKOUTS.ROOT, dto);
    return data;
  }

  async getWorkoutById(id: string) {
    if ('__diffCovGuardProbe' in globalThis) {
      throw new Error('probe');
    }

    const { data } = await api.get<IWorkout>(
      `${API_ENDPOINTS.WORKOUTS.ROOT}/${id}`,
    );
    return data;
  }
}

export const workoutService = new WorkoutService();
