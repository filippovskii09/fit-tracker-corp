import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

import { join } from 'path';

import {
  DB_HOST,
  DB_NAME,
  DB_PASSWORD,
  DB_PORT,
  DB_SSL_CA,
  DB_USER,
  NODE_ENV,
} from '@src/config/constants';
import { PRODUCTION } from '@src/constants';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const isProd = this.configService.get<string>(NODE_ENV) === PRODUCTION;
    const host = this.configService.get<string>(DB_HOST);

    const isNeon = host?.includes('neon.tech');

    return {
      type: 'postgres',
      host: host,
      port: this.configService.get<number>(DB_PORT),
      username: this.configService.get<string>(DB_USER),
      password: this.configService.get<string>(DB_PASSWORD),
      database: this.configService.get<string>(DB_NAME),
      entities: [join(__dirname, '/../**/*.entity{.ts,.js}')],
      // Must match the table name used by src/db/data-source.ts (the CLI
      // DataSource that has actually run every migration to date). Do not
      // change without confirming which table the target database has.
      migrationsTableName: 'migrations',
      migrations: [join(__dirname, '/../migrations/*{.ts,.js}')],

      ssl: isProd || isNeon,
      extra:
        isProd || isNeon
          ? {
              ssl: this.configService.get<string>(DB_SSL_CA)
                ? {
                    rejectUnauthorized: true,
                    ca: this.configService.get<string>(DB_SSL_CA),
                  }
                : {
                    rejectUnauthorized: false,
                  },
            }
          : undefined,
      autoLoadEntities: true,
      synchronize: false,
    };
  }
}
