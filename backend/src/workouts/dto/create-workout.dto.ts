import { Type } from 'class-transformer';
import {
  IsNumber,
  Min,
  IsInt,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  IsUUID,
  IsArray,
  ValidateNested,
  IsString,
  IsDateString,
} from 'class-validator';

import {
  ICreateWorkout,
  ICreateWorkoutExercise,
  ICreateWorkoutSet,
} from '../types';

export class CreateWorkoutSetDto implements ICreateWorkoutSet {
  @IsNumber()
  @Min(0)
  weight!: number;

  @IsInt()
  @Min(1)
  reps!: number;

  /**
   * Sequence index of the set (e.g., 1st set, 2nd set).
   * Needed to maintain correct order when fetching from DB.
   */
  @IsInt()
  order!: number;

  /**
   * Useful for UI tracking (checkboxes).
   * Can be false if user planned the set but didn't finish it.
   */
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}

export class CreateWorkoutExerciseDto implements ICreateWorkoutExercise {
  /**
   * Reference to the Global Exercise Catalog (Dictionary).
   * Not to be confused with the workout-specific exercise ID.
   */
  @IsNotEmpty()
  @IsUUID()
  exerciseId!: string;

  /**
   * Sequence index of the exercise in the workout list.
   */
  @IsInt()
  order!: number;

  /**
   * Nested array of sets.
   * Saved automatically via TypeORM cascade logic.
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkoutSetDto)
  sets!: CreateWorkoutSetDto[];
}

export class CreateWorkoutDto implements ICreateWorkout {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsDateString()
  date!: string;

  /**
   * Full tree structure of exercises and their sets.
   * Executed as a single transaction batch.
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkoutExerciseDto)
  exercises!: CreateWorkoutExerciseDto[];
}
