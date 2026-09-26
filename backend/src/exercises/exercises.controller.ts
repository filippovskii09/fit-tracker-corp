import { Controller, Get, Header } from '@nestjs/common';

import { ExercisesService } from './exercises.service';

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  // Public, unauthenticated catalog: overrides the global no-store default
  // set by noStoreCacheMiddleware for this handler only.
  @Header('Cache-Control', 'public, max-age=300')
  @Get()
  async getAll() {
    return await this.exercisesService.findAll();
  }
}
