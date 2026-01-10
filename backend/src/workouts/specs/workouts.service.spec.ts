import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

import { ObjectLiteral, Repository } from 'typeorm';

import { WorkoutsService } from '../workouts.service';
import { WorkoutEntity } from '../entities';
import { CreateWorkoutDto } from '../dto';

type MockRepository<T extends ObjectLiteral = WorkoutEntity> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const mockWorkoutRepository = (): MockRepository<WorkoutEntity> => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
});

describe('WorkoutsService', () => {
  let service: WorkoutsService;
  let repository: MockRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkoutsService,
        {
          provide: getRepositoryToken(WorkoutEntity),
          useFactory: mockWorkoutRepository,
        },
      ],
    }).compile();

    service = module.get<WorkoutsService>(WorkoutsService);
    repository = module.get(getRepositoryToken(WorkoutEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create and save a workout with exercises and sets', async () => {
      const userId = 'user-uuid';
      const dto: CreateWorkoutDto = {
        name: 'Leg Day',
        date: '2024-01-01',
        exercises: [
          {
            exerciseId: 'ex-1',
            order: 1,
            sets: [{ weight: 100, reps: 10, order: 1, isCompleted: true }],
          },
        ],
      };

      const expectedWorkout = {
        ...dto,
        userId,
        status: 'COMPLETED',
        id: 'new-id',
        exercises: dto.exercises.map((ex) => ({
          ...ex,
          exercise: { id: ex.exerciseId },
          sets: ex.sets,
        })),
      };

      repository.create!.mockReturnValue(expectedWorkout);
      repository.save!.mockResolvedValue(expectedWorkout);

      const result = await service.create(dto, userId);

      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledWith(expectedWorkout);
      expect(result).toEqual(expectedWorkout);
    });
  });

  describe('findAll', () => {
    it('should return an array of workouts for specific user', async () => {
      const userId = 'user-uuid';
      const mockWorkouts = [{ id: '1', name: 'Test', userId }];

      repository.find!.mockResolvedValue(mockWorkouts);

      const result = await service.findAll(userId);

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { date: 'DESC' },
        select: ['id', 'name', 'date', 'status'],
      });
      expect(result).toEqual(mockWorkouts);
    });
  });

  describe('findOne', () => {
    it('should return a workout if found and belongs to user', async () => {
      const workoutId = 'uuid-1';
      const userId = 'user-uuid';
      const mockWorkout = { id: workoutId, name: 'Chest', userId };

      repository.findOne!.mockResolvedValue(mockWorkout);

      const result = await service.findOne(workoutId, userId);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: workoutId, userId },
        relations: {
          exercises: {
            exercise: true,
            sets: true,
          },
        },
        order: {
          exercises: {
            order: 'ASC',
            sets: { order: 'ASC' },
          },
        },
      });
      expect(result).toEqual(mockWorkout);
    });

    it('should throw NotFoundException if workout not found', async () => {
      repository.findOne!.mockResolvedValue(null);
      await expect(service.findOne('bad-id', 'user-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a workout', async () => {
      const workoutId = 'uuid-1';
      const userId = 'user-uuid';
      repository.delete!.mockResolvedValue({ affected: 1 });

      const result = await service.remove(workoutId, userId);

      expect(repository.delete).toHaveBeenCalledWith({ id: workoutId, userId });
      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException if nothing to delete', async () => {
      repository.delete!.mockResolvedValue({ affected: 0 });
      await expect(service.remove('bad-id', 'user-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
