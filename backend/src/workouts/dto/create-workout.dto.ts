import { Type } from 'class-transformer';
import {
  IsNumber,
  Min,
  Max,
  IsInt,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  IsUUID,
  IsArray,
  ArrayMaxSize,
  ValidateNested,
  IsString,
  MaxLength,
  IsDateString,
} from 'class-validator';

import {
  ICreateWorkout,
  ICreateWorkoutExercise,
  ICreateWorkoutSet,
} from '../types';

// Sane upper bounds: generous enough for any real workout, small enough to
// bound payload/query size. Frontend form validation should mirror these.
const MAX_WORKOUT_NAME_LENGTH = 100;
const MAX_EXERCISES_PER_WORKOUT = 50;
const MAX_SETS_PER_EXERCISE = 50;
const MAX_SET_WEIGHT_KG = 1000;
const MAX_SET_REPS = 1000;

export class CreateWorkoutSetDto implements ICreateWorkoutSet {
  @IsNumber()
  @Min(0)
  @Max(MAX_SET_WEIGHT_KG)
  weight!: number;

  @IsInt()
  @Min(1)
  @Max(MAX_SET_REPS)
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
  @ArrayMaxSize(MAX_SETS_PER_EXERCISE)
  @ValidateNested({ each: true })
  @Type(() => CreateWorkoutSetDto)
  sets!: CreateWorkoutSetDto[];
}

export class CreateWorkoutDto implements ICreateWorkout {
  @IsNotEmpty()
  @IsString()
  @MaxLength(MAX_WORKOUT_NAME_LENGTH)
  name!: string;

  @IsNotEmpty()
  @IsDateString()
  date!: string;

  /**
   * Full tree structure of exercises and their sets.
   * Executed as a single transaction batch.
   */
  @IsArray()
  @ArrayMaxSize(MAX_EXERCISES_PER_WORKOUT)
  @ValidateNested({ each: true })
  @Type(() => CreateWorkoutExerciseDto)
  exercises!: CreateWorkoutExerciseDto[];

  /**
   * Stable client-generated id used to make retried create requests
   * idempotent per user. Optional for legacy clients during rollout.
   */
  @IsOptional()
  @IsUUID('4')
  clientRequestId?: string;
}
