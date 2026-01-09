import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';

import { ExercisesService } from '../exercises.service';
import { ExerciseEntity } from '../entities/exercise.entity';
import { MuscleGroup } from '../enums';

describe('ExercisesService', () => {
  let service: ExercisesService;

  const mockExerciseRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExercisesService,
        {
          provide: getRepositoryToken(ExerciseEntity),
          useValue: mockExerciseRepository,
        },
      ],
    }).compile();

    service = module.get<ExercisesService>(ExercisesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new exercise', async () => {
      const dto = { name: 'Bench Press', muscleGroup: MuscleGroup.CHEST };
      mockExerciseRepository.findOne.mockResolvedValue(null);
      mockExerciseRepository.save.mockResolvedValue({ id: 'uuid', ...dto });

      const result = await service.create(dto, 'user-123');

      expect(result).toHaveProperty('id');
      expect(mockExerciseRepository.save).toHaveBeenCalledWith({
        ...dto,
        userId: 'user-123',
      });
    });

    it('should throw ConflictException if exercise name exists', async () => {
      mockExerciseRepository.findOne.mockResolvedValue({ id: '1' });
      const dto = { name: 'Bench Press', muscleGroup: MuscleGroup.CHEST };

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return an array of exercises', async () => {
      const exercises = [{ name: 'Push up' }];
      mockExerciseRepository.find.mockResolvedValue(exercises);

      const result = await service.findAll();
      expect(result).toEqual(exercises);
    });
  });

  describe('seed', () => {
    it('should skip seeding if exercises already exist', async () => {
      mockExerciseRepository.count.mockResolvedValue(10);
      const loggerSpy = jest.spyOn(service['logger'], 'warn');

      await service.seed();

      expect(mockExerciseRepository.count).toHaveBeenCalled();
      expect(mockExerciseRepository.save).not.toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Seeding skipped'),
      );
    });

    it('should seed exercises if database is empty', async () => {
      mockExerciseRepository.count.mockResolvedValue(0);
      mockExerciseRepository.create.mockReturnValue([]);
      mockExerciseRepository.save.mockResolvedValue([]);

      await service.seed();

      expect(mockExerciseRepository.count).toHaveBeenCalled();
      expect(mockExerciseRepository.create).toHaveBeenCalled();
      expect(mockExerciseRepository.save).toHaveBeenCalled();
    });
  });
});
