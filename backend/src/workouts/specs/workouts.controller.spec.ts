import { Test, TestingModule } from '@nestjs/testing';

import { WorkoutsController } from '../workouts.controller';
import { WorkoutsService } from '../workouts.service';
import { CreateWorkoutDto } from '../dto';
import { ResponseMessages } from '@src/common/messages';

describe('WorkoutsController', () => {
  let controller: WorkoutsController;
  let service: WorkoutsService;

  const mockWorkoutsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkoutsController],
      providers: [
        {
          provide: WorkoutsService,
          useValue: mockWorkoutsService,
        },
      ],
    }).compile();

    controller = module.get<WorkoutsController>(WorkoutsController);
    service = module.get<WorkoutsService>(WorkoutsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with correct params', async () => {
      const dto = new CreateWorkoutDto();
      const userId = 'user-uuid';
      const result = { id: 'new-id', ...dto };

      mockWorkoutsService.create.mockResolvedValue(result);

      const response = await controller.create(dto, userId);

      expect(service.create).toHaveBeenCalledWith(dto, userId);
      expect(response).toEqual(result);
    });

    it('should throw Error if userId is missing', async () => {
      const dto = new CreateWorkoutDto();
      // @ts-expect-error: userId is required but we test missing userId
      await expect(controller.create(dto, null)).rejects.toThrow(
        ResponseMessages.User.IdNotFound,
      );
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with userId', async () => {
      const userId = 'user-uuid';
      mockWorkoutsService.findAll.mockResolvedValue([]);

      await controller.findAll(userId);

      expect(service.findAll).toHaveBeenCalledWith(userId);
    });

    it('should throw Error if userId is missing', async () => {
      // @ts-expect-error: userId is required but we test missing userId
      await expect(controller.findAll(null)).rejects.toThrow(
        ResponseMessages.User.IdNotFound,
      );
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id and userId', async () => {
      const id = 'uuid-1';
      const userId = 'user-uuid';
      const result = { id, name: 'Test' };
      mockWorkoutsService.findOne.mockResolvedValue(result);

      const response = await controller.findOne(id, userId);

      expect(service.findOne).toHaveBeenCalledWith(id, userId);
      expect(response).toEqual(result);
    });
  });

  describe('remove', () => {
    it('should call service.remove with id and userId', async () => {
      const id = 'uuid-1';
      const userId = 'user-uuid';
      const result = { deleted: true };
      mockWorkoutsService.remove.mockResolvedValue(result);

      const response = await controller.remove(id, userId);

      expect(service.remove).toHaveBeenCalledWith(id, userId);
      expect(response).toEqual(result);
    });
  });
});
