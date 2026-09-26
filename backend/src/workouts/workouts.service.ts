import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { QueryFailedError, Repository } from 'typeorm';

import { ResponseMessages } from '@src/common/messages';
import { WorkoutEntity } from './entities';
import { CreateWorkoutDto } from './dto';
import { IdempotencyKeyReusedException } from './exceptions/idempotency-key-reused.exception';
import { hashWorkoutPayload } from './utils/canonicalize-payload';

const POSTGRES_UNIQUE_VIOLATION = '23505';

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    'code' in error &&
    (error as { code?: string }).code === POSTGRES_UNIQUE_VIOLATION
  );
}

@Injectable()
export class WorkoutsService {
  constructor(
    @InjectRepository(WorkoutEntity)
    private readonly workoutsRepository: Repository<WorkoutEntity>,
  ) {}

  private findByClientRequestId(userId: string, clientRequestId: string) {
    return this.workoutsRepository.findOne({
      where: { userId, clientRequestId },
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
  }

  async create(createWorkoutDto: CreateWorkoutDto, userId: string) {
    const { clientRequestId } = createWorkoutDto;
    const payloadHash = clientRequestId
      ? hashWorkoutPayload(createWorkoutDto)
      : null;

    if (clientRequestId) {
      const existing = await this.findByClientRequestId(
        userId,
        clientRequestId,
      );
      if (existing) return this.resolveIdempotentHit(existing, payloadHash!);
    }

    const workout = this.workoutsRepository.create({
      name: createWorkoutDto.name,
      date: createWorkoutDto.date,
      userId,
      status: 'COMPLETED',
      clientRequestId: clientRequestId ?? null,
      payloadHash,
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

    try {
      return await this.workoutsRepository.save(workout);
    } catch (error) {
      if (clientRequestId && isUniqueViolation(error)) {
        // Concurrent duplicate submission for the same user/request id:
        // the other request won the insert race, so resolve against its
        // result instead.
        const existing = await this.findByClientRequestId(
          userId,
          clientRequestId,
        );
        if (existing) return this.resolveIdempotentHit(existing, payloadHash!);
      }
      throw error;
    }
  }

  private resolveIdempotentHit(
    existing: WorkoutEntity,
    payloadHash: string,
  ): WorkoutEntity {
    if (existing.payloadHash === payloadHash) return existing;

    throw new IdempotencyKeyReusedException(
      ResponseMessages.Workout.IdempotencyKeyReused,
      existing.id,
    );
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
