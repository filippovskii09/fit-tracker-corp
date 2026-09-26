import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { WorkoutExerciseEntity } from './workout-exercise.entity';

@Entity('workouts')
@Index('UQ_workouts_userId_clientRequestId', ['userId', 'clientRequestId'], {
  unique: true,
})
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

  @Column({ type: 'varchar', nullable: true })
  clientRequestId!: string | null;

  /**
   * SHA-256 of the canonicalized create payload, stored alongside
   * `clientRequestId` so a replay with a different payload under the same
   * key can be detected and rejected (409) instead of silently returning
   * stale data.
   */
  @Column({ type: 'varchar', nullable: true })
  payloadHash!: string | null;

  @OneToMany(() => WorkoutExerciseEntity, (exercise) => exercise.workout, {
    cascade: true,
  })
  exercises!: WorkoutExerciseEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
