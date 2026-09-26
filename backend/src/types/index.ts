export interface ENVSchemaI {
  NODE_ENV: string;
  PORT: number;
  FRONTEND_URL: string;
  // DB
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  DB_SSL_CA?: string;
  // JWT
  JWT_ACCESS_TOKEN_SECRET: string;
  JWT_ACCESS_TOKEN_EXPIRATION_TIME: number;

  JWT_REFRESH_TOKEN_SECRET: string;
  JWT_REFRESH_TOKEN_EXPIRATION_TIME: number;

  // Auth cookie
  AUTH_COOKIE_SAME_SITE: 'lax' | 'strict' | 'none';

  // Reverse proxy
  TRUST_PROXY?: number;
}
