import { config } from 'dotenv';
import { join } from 'path';
import { DataSource } from 'typeorm';

config();

const entitiesPath = join(__dirname, '../**/*.entity{.ts,.js}');
const migrationsPath = join(__dirname, '../migrations/*{.ts,.js}');

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [entitiesPath],
  migrations: [migrationsPath],
  // Explicit (rather than relying on the TypeORM default) so this stays the
  // single source of truth for the migrations-history table name. This is
  // the DataSource every `migration:*` CLI command and the release migrate
  // step (src/db/migrate.ts) use, and must match typeorm-config.service.ts.
  migrationsTableName: 'migrations',
  synchronize: false,
  ssl:
    process.env.NODE_ENV === 'production'
      ? process.env.DB_SSL_CA
        ? { rejectUnauthorized: true, ca: process.env.DB_SSL_CA }
        : { rejectUnauthorized: false }
      : false,
});
