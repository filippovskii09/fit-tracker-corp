import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ExercisesService } from './exercises.service';
import { ExerciseEntity } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([ExerciseEntity])],
  providers: [ExercisesService],
  exports: [ExercisesService],
})
export class ExercisesModule {}
