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

export interface ExerciseInfoResponse {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
}

export interface IExercise {
  id?: string;
  exerciseId: string;
  name?: string;
  order: number;
  sets: ISet[];
  exercise?: ExerciseInfoResponse;
}

export interface ISet {
  id?: string;
  weight: number;
  reps: number;
  order: number;
  isCompleted: boolean;
}
