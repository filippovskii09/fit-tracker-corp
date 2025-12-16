import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

import {
  DB_HOST,
  DB_NAME,
  DB_PASSWORD,
  DB_PORT,
  DB_USER,
  NODE_ENV,
} from '@src/config/constants';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.configService.get<string>(DB_HOST),
      port: this.configService.get<number>(DB_PORT),
      username: this.configService.get<string>(DB_USER),
      password: this.configService.get<string>(DB_PASSWORD),
      database: this.configService.get<string>(DB_NAME),
      entities: ['dist/**/*.entity{.ts,.js}'],
      migrationsTableName: 'migration',
      migrations: ['dist/migration/*.js'],
      ssl: this.configService.get<string>(NODE_ENV) === 'production',
      autoLoadEntities: true,
      synchronize: false,
    };
  }
}
