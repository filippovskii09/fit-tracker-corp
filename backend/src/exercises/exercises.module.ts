import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ExercisesService } from './exercises.service';
import { ExercisesController } from './exercises.controller';
import { ExerciseEntity } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([ExerciseEntity])],
  controllers: [ExercisesController],
  providers: [ExercisesService],
  exports: [ExercisesService],
})
export class ExercisesModule {}
