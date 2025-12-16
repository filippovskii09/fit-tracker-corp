import Joi from 'joi';

import { DEFAULT_DB_PORT, DEFAULT_PORT } from '@src/constants';
import { ENVSchemaI } from '@src/types';

export const envSchema = Joi.object<ENVSchemaI>({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().port().default(DEFAULT_PORT),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().default(DEFAULT_DB_PORT),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  FRONTEND_URL: Joi.string().required(),
});
