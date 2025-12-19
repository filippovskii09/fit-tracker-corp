import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

import { TypeOrmConfigService } from '../typeorm-config.service';
import {
  DB_HOST,
  DB_NAME,
  DB_PASSWORD,
  DB_PORT,
  DB_USER,
  NODE_ENV,
} from '@src/config/constants';
import { PRODUCTION } from '@src/constants';

describe('TypeOrmConfigService', () => {
  let service: TypeOrmConfigService;
  let configService: ConfigService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string): string | number | undefined => {
        const envMock: Record<string, string | number> = {
          [DB_HOST]: 'test_host',
          [DB_PORT]: 5432,
          [DB_USER]: 'db_user',
          [DB_PASSWORD]: 'db_password',
          [DB_NAME]: 'db_name',
          [NODE_ENV]: 'development',
        };
        return envMock[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmConfigService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TypeOrmConfigService>(TypeOrmConfigService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return correct TypeORM options for development', () => {
    const options = service.createTypeOrmOptions();

    expect(options).toMatchObject({
      type: 'postgres',
      host: 'test_host',
      port: 5432,
      username: 'db_user',
      password: 'db_password',
      database: 'db_name',
      synchronize: false,
      ssl: false,
    });
  });

  it('should enable SSL in production enviroment', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === NODE_ENV) return PRODUCTION;
      return 'some_value';
    });

    const options = service.createTypeOrmOptions() as PostgresConnectionOptions;

    expect(options.ssl).toBe(true);
  });
});
