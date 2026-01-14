import { Test, TestingModule } from '@nestjs/testing';

import { ExercisesController } from '../exercises.controller';
import { ExercisesService } from '../exercises.service';

describe('ExercisesController', () => {
  let controller: ExercisesController;
  let service: ExercisesService;

  const mockExercisesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    seed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExercisesController],
      providers: [
        {
          provide: ExercisesService,
          useValue: mockExercisesService,
        },
      ],
    }).compile();

    controller = module.get<ExercisesController>(ExercisesController);
    service = module.get<ExercisesService>(ExercisesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(controller).toBeDefined());

  describe('getAll', () => {
    it('should call service.findAll', async () => {
      mockExercisesService.findAll();

      await controller.getAll();

      expect(service.findAll).toHaveBeenCalled();
    });
  });
});
