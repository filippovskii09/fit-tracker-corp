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
  synchronize: false,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});
