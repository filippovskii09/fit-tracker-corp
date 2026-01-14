import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { ValidationMessages } from '@src/common/messages';
import { ExerciseEntity } from './entities/exercise.entity';
import { INITIAL_EXERCISES } from './data/initial-exercises';
import { CreateExerciseDto } from './dto';

@Injectable()
export class ExercisesService {
  private readonly logger = new Logger(ExercisesService.name);

  constructor(
    @InjectRepository(ExerciseEntity)
    private readonly exerciseRepository: Repository<ExerciseEntity>,
  ) {}

  async create(
    createExerciseDto: CreateExerciseDto,
    userId: string | null = null,
  ) {
    const existing = await this.exerciseRepository.findOne({
      where: { name: createExerciseDto.name },
    });
    if (existing)
      throw new ConflictException(ValidationMessages.Exercise.AllReadyExist);
    return this.exerciseRepository.save({ ...createExerciseDto, userId });
  }

  async findAll() {
    return this.exerciseRepository.find({
      order: { name: 'ASC' },
      select: ['id', 'name', 'muscleGroup'],
    });
  }

  async seed() {
    const count = await this.exerciseRepository.count();
    if (count > 0) {
      this.logger.warn('Seeding skipped: Database is not empty.');
      return;
    }

    this.logger.log('Starting seeding process...');

    const exercises = this.exerciseRepository.create(INITIAL_EXERCISES);

    await this.exerciseRepository.save(exercises);

    this.logger.log(`Successfully seeded ${exercises.length} exercises.`);
  }
}
