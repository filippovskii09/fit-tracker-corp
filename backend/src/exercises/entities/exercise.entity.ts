import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { IExercise } from '../types';
import { MuscleGroup } from '../enums';

@Entity('exercises')
export class ExerciseEntity implements IExercise {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({
    type: 'enum',
    enum: MuscleGroup,
    default: MuscleGroup.FULL_BODY,
  })
  muscleGroup!: MuscleGroup;

  @Column({ type: 'uuid', nullable: true })
  userId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
