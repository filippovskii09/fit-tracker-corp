import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { ResponseMessages } from '@src/common/messages';
import { WorkoutEntity } from './entities';
import { CreateWorkoutDto } from './dto';

@Injectable()
export class WorkoutsService {
  constructor(
    @InjectRepository(WorkoutEntity)
    private readonly workoutsRepository: Repository<WorkoutEntity>,
  ) {}

  create(createWorkoutDto: CreateWorkoutDto, userId: string) {
    const workout = this.workoutsRepository.create({
      name: createWorkoutDto.name,
      date: createWorkoutDto.date,
      userId,
      status: 'COMPLETED',
      exercises: createWorkoutDto.exercises.map((ex) => ({
        order: ex.order,
        exercise: { id: ex.exerciseId },
        sets: ex.sets.map((set) => ({
          weight: set.weight,
          reps: set.reps,
          order: set.order,
          isCompleted: set.isCompleted,
        })),
      })),
    });
    return this.workoutsRepository.save(workout);
  }

  findAll(userId: string) {
    return this.workoutsRepository.find({
      where: { userId },
      order: { date: 'DESC' },
      select: ['id', 'name', 'date', 'status'],
    });
  }

  async findOne(id: string, userId: string) {
    const workout = await this.workoutsRepository.findOne({
      where: { id, userId },
      relations: {
        exercises: {
          exercise: true,
          sets: true,
        },
      },
      order: {
        exercises: {
          order: 'ASC',
          sets: {
            order: 'ASC',
          },
        },
      },
    });

    if (!workout)
      throw new NotFoundException(ResponseMessages.Workout.NotFound);

    return workout;
  }

  async remove(id: string, userId: string) {
    const result = await this.workoutsRepository.delete({ id, userId });
    if (result.affected === 0)
      throw new NotFoundException(ResponseMessages.Workout.NotFound);
    return {
      deleted: true,
    };
  }
}
