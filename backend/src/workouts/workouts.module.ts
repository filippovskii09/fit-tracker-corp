import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkoutsService } from './workouts.service';
import { WorkoutsController } from './workouts.controller';
import {
  WorkoutEntity,
  WorkoutExerciseEntity,
  WorkoutSetEntity,
} from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkoutEntity,
      WorkoutExerciseEntity,
      WorkoutSetEntity,
    ]),
  ],
  controllers: [WorkoutsController],
  providers: [WorkoutsService],
})
export class WorkoutsModule {}
