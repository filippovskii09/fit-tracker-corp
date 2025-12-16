import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';

import { DataSource } from 'typeorm';

import { DBService } from '../db.service';

const mockInitialize = jest.fn().mockResolvedValue(true);

const mockDataSource = {
  isInitialized: false,
  initialize: mockInitialize,
};

describe('DBService', () => {
  let service: DBService;
  let loggerSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DBService,
        Logger,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<DBService>(DBService);
    loggerSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize database connection if not initialized', async () => {
    Object.defineProperty(mockDataSource, 'isInitialized', {
      get: () => false,
    });

    await service.onModuleInit();

    expect(mockInitialize).toHaveBeenCalled();
  });

  it('should not initialize if already connected', async () => {
    Object.defineProperty(mockDataSource, 'isInitialized', { get: () => true });

    await service.onModuleInit();

    expect(mockInitialize).not.toHaveBeenCalled();
  });

  it('should log specific error msg and re-throw of initialization fails with Error object', async () => {
    const errorMsg = 'Connection timeout!';
    const dbError = new Error(errorMsg);

    Object.defineProperty(mockDataSource, 'isInitialized', {
      get: () => false,
    });
    mockInitialize.mockRejectedValueOnce(dbError);

    await expect(service.onModuleInit()).rejects.toThrow(dbError);
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('failed'),
      errorMsg,
    );
  });

  it('should log "Unknow DB error" and and re-throw of initialization fails with non Error object', async () => {
    const err = 'Just a string error message';

    Object.defineProperty(mockDataSource, 'isInitialized', {
      get: () => false,
    });
    mockInitialize.mockRejectedValueOnce(err);

    await expect(service.onModuleInit()).rejects.toBe(err);

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('failed'),
      'Unknown database error',
    );
  });
});
