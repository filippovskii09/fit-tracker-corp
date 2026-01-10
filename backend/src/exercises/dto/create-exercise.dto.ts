import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { MuscleGroup } from '../enums';

export class CreateExerciseDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsEnum(MuscleGroup)
  muscleGroup!: MuscleGroup;
}
