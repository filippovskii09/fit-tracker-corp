enum MuscleGroup {
  CHEST = 'Chest',
  BACK = 'Back',
  LEGS = 'Legs',
  SHOULDERS = 'Shoulders',
  BICEPS = 'Biceps',
  TRICEPS = 'Triceps',
  ABS = 'Abs',
  CARDIO = 'Cardio',
  FULL_BODY = 'Full Body',
}

export interface ExercisesResponse {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
}

export interface IExercise {
  exerciseId: string;
  name?: string;
  order: number;
  sets: ISet[];
}

export interface ISet {
  weight: number;
  reps: number;
  order: number;
  isCompleted: boolean;
}
