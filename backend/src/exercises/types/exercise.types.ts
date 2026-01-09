import { MuscleGroup } from '../enums';

export interface IExercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
