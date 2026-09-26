import { Logger } from '@nestjs/common';
import Joi from 'joi';

import {
  DEFAULT_AUTH_COOKIE_SAME_SITE,
  DEFAULT_DB_PORT,
  DEFAULT_PORT,
} from '@src/constants';
import { ENVSchemaI } from '@src/types';

const MIN_JWT_SECRET_LENGTH = 32;
const MAX_RECOMMENDED_ACCESS_TOKEN_SECONDS = 3600;
const MAX_RECOMMENDED_REFRESH_TOKEN_SECONDS = 30 * 24 * 60 * 60;

// Documented defaults (see README/deployment docs): 900s access / 604800s refresh.
// Lifetimes are intentionally required (not Joi defaults) so a missing value fails
// startup instead of silently running with an undocumented value.
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
  DB_SSL_CA: Joi.string().optional(),
  FRONTEND_URL: Joi.string().required(),

  JWT_ACCESS_TOKEN_SECRET: Joi.string().min(MIN_JWT_SECRET_LENGTH).required(),
  JWT_ACCESS_TOKEN_EXPIRATION_TIME: Joi.number()
    .integer()
    .positive()
    .required(),
  JWT_REFRESH_TOKEN_SECRET: Joi.string().min(MIN_JWT_SECRET_LENGTH).required(),
  JWT_REFRESH_TOKEN_EXPIRATION_TIME: Joi.number()
    .integer()
    .positive()
    .required(),

  AUTH_COOKIE_SAME_SITE: Joi.string()
    .valid('lax', 'strict', 'none')
    .default(DEFAULT_AUTH_COOKIE_SAME_SITE),

  TRUST_PROXY: Joi.number().integer().min(0).optional(),
}).custom((value: ENVSchemaI, helpers) => {
  if (
    value.JWT_ACCESS_TOKEN_EXPIRATION_TIME >=
    value.JWT_REFRESH_TOKEN_EXPIRATION_TIME
  ) {
    return helpers.message({
      custom:
        'JWT_ACCESS_TOKEN_EXPIRATION_TIME must be shorter than JWT_REFRESH_TOKEN_EXPIRATION_TIME',
    });
  }

  if (value.JWT_ACCESS_TOKEN_SECRET === value.JWT_REFRESH_TOKEN_SECRET) {
    return helpers.message({
      custom:
        'JWT_ACCESS_TOKEN_SECRET and JWT_REFRESH_TOKEN_SECRET must be different',
    });
  }

  if (
    value.JWT_ACCESS_TOKEN_EXPIRATION_TIME >
    MAX_RECOMMENDED_ACCESS_TOKEN_SECONDS
  ) {
    Logger.warn(
      `JWT_ACCESS_TOKEN_EXPIRATION_TIME (${value.JWT_ACCESS_TOKEN_EXPIRATION_TIME}s) exceeds the recommended ${MAX_RECOMMENDED_ACCESS_TOKEN_SECONDS}s (1h); consider shortening it.`,
      'EnvValidation',
    );
  }

  if (
    value.JWT_REFRESH_TOKEN_EXPIRATION_TIME >
    MAX_RECOMMENDED_REFRESH_TOKEN_SECONDS
  ) {
    Logger.warn(
      `JWT_REFRESH_TOKEN_EXPIRATION_TIME (${value.JWT_REFRESH_TOKEN_EXPIRATION_TIME}s) exceeds the recommended ${MAX_RECOMMENDED_REFRESH_TOKEN_SECONDS}s (30d); consider shortening it.`,
      'EnvValidation',
    );
  }

  return value;
});
