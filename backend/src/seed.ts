import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';
import { ExercisesService } from './exercises/exercises.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const exercisesService = app.get(ExercisesService);

    await exercisesService.seed();
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(errMsg);
  } finally {
    await app.close();
  }
}

bootstrap();
