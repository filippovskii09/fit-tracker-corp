import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ExerciseEntity } from '@src/exercises/entities';
import { WorkoutSetEntity } from './workout-set.entity';
import { WorkoutEntity } from './workout.entity';

@Entity('workout_exercises')
export class WorkoutExerciseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  order!: number;

  @Column({ type: 'uuid' })
  exerciseId!: string;

  @ManyToOne(() => WorkoutEntity, (workout) => workout.exercises, {
    onDelete: 'CASCADE',
  })
  workout!: WorkoutEntity;

  @ManyToOne(() => ExerciseEntity)
  @JoinColumn({ name: 'exerciseId' })
  exercise!: ExerciseEntity;

  @OneToMany(() => WorkoutSetEntity, (set) => set.workoutExercise, {
    cascade: true,
  })
  sets!: WorkoutSetEntity[];
}
