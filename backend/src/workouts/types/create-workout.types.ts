export interface ICreateWorkoutSet {
  weight: number;
  reps: number;
  order: number;
  isCompleted?: boolean;
}

export interface ICreateWorkoutExercise {
  exerciseId: string;
  order: number;
  sets: ICreateWorkoutSet[];
}

export interface ICreateWorkout {
  name: string;
  date: string;
  exercises: ICreateWorkoutExercise[];
}
