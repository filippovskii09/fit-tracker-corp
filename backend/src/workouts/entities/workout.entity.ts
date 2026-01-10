import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { WorkoutExerciseEntity } from './workout-exercise.entity';

@Entity('workouts')
export class WorkoutEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'timestamp' })
  date!: Date;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ default: 'COMPLETED' })
  status!: string;

  @OneToMany(() => WorkoutExerciseEntity, (exercise) => exercise.workout, {
    cascade: true,
  })
  exercises!: WorkoutExerciseEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
