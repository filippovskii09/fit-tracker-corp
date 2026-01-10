import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { WorkoutExerciseEntity } from './workout-exercise.entity';

@Entity('workout_sets')
export class WorkoutSetEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'float' })
  weight!: number;

  @Column()
  reps!: number;

  @Column()
  order!: number;

  @Column({ default: false })
  isCompleted!: boolean;

  @ManyToOne(
    () => WorkoutExerciseEntity,
    (workoutExercise) => workoutExercise.sets,
    {
      onDelete: 'CASCADE',
    },
  )
  workoutExercise!: WorkoutExerciseEntity;
}
