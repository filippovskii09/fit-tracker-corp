import { Logger } from '@nestjs/common';

import { envSchema } from '../env.validation';

const validBase = {
  NODE_ENV: 'test',
  DB_HOST: 'localhost',
  DB_USER: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_NAME: 'db',
  FRONTEND_URL: 'http://localhost:5173',
  JWT_ACCESS_TOKEN_SECRET: 'a'.repeat(32),
  JWT_REFRESH_TOKEN_SECRET: 'b'.repeat(32),
};

describe('envSchema', () => {
  it('accepts an access lifetime shorter than the refresh lifetime', () => {
    const { error, value } = envSchema.validate({
      ...validBase,
      JWT_ACCESS_TOKEN_EXPIRATION_TIME: 900,
      JWT_REFRESH_TOKEN_EXPIRATION_TIME: 604800,
    });

    expect(error).toBeUndefined();
    expect(value.JWT_ACCESS_TOKEN_EXPIRATION_TIME).toBe(900);
    expect(value.JWT_REFRESH_TOKEN_EXPIRATION_TIME).toBe(604800);
    expect(value.AUTH_COOKIE_SAME_SITE).toBe('lax');
  });

  it('rejects a missing access lifetime', () => {
    const { error } = envSchema.validate({
      ...validBase,
      JWT_REFRESH_TOKEN_EXPIRATION_TIME: 604800,
    });

    expect(error).toBeDefined();
  });

  it('rejects a non-positive lifetime', () => {
    const { error } = envSchema.validate({
      ...validBase,
      JWT_ACCESS_TOKEN_EXPIRATION_TIME: 0,
      JWT_REFRESH_TOKEN_EXPIRATION_TIME: 604800,
    });

    expect(error).toBeDefined();
  });

  it('rejects a fractional lifetime', () => {
    const { error } = envSchema.validate({
      ...validBase,
      JWT_ACCESS_TOKEN_EXPIRATION_TIME: 15.5,
      JWT_REFRESH_TOKEN_EXPIRATION_TIME: 604800,
    });

    expect(error).toBeDefined();
  });

  it('rejects an access lifetime that is not shorter than the refresh lifetime', () => {
    const { error } = envSchema.validate({
      ...validBase,
      JWT_ACCESS_TOKEN_EXPIRATION_TIME: 604800,
      JWT_REFRESH_TOKEN_EXPIRATION_TIME: 604800,
    });

    expect(error).toBeDefined();
    expect(error?.message).not.toMatch(/secret/i);
  });

  it('rejects an invalid AUTH_COOKIE_SAME_SITE value', () => {
    const { error } = envSchema.validate({
      ...validBase,
      JWT_ACCESS_TOKEN_EXPIRATION_TIME: 900,
      JWT_REFRESH_TOKEN_EXPIRATION_TIME: 604800,
      AUTH_COOKIE_SAME_SITE: 'invalid',
    });

    expect(error).toBeDefined();
  });

  it('rejects a JWT secret shorter than 32 characters', () => {
    const { error } = envSchema.validate({
      ...validBase,
      JWT_ACCESS_TOKEN_SECRET: 'too-short',
      JWT_ACCESS_TOKEN_EXPIRATION_TIME: 900,
      JWT_REFRESH_TOKEN_EXPIRATION_TIME: 604800,
    });

    expect(error).toBeDefined();
  });

  it('rejects identical access and refresh secrets', () => {
    const sameSecret = 'c'.repeat(32);
    const { error } = envSchema.validate({
      ...validBase,
      JWT_ACCESS_TOKEN_SECRET: sameSecret,
      JWT_REFRESH_TOKEN_SECRET: sameSecret,
      JWT_ACCESS_TOKEN_EXPIRATION_TIME: 900,
      JWT_REFRESH_TOKEN_EXPIRATION_TIME: 604800,
    });

    expect(error).toBeDefined();
    expect(error?.message).toMatch(/different/i);
  });

  it('accepts an optional TRUST_PROXY hop count', () => {
    const { error, value } = envSchema.validate({
      ...validBase,
      JWT_ACCESS_TOKEN_EXPIRATION_TIME: 900,
      JWT_REFRESH_TOKEN_EXPIRATION_TIME: 604800,
      TRUST_PROXY: 1,
    });

    expect(error).toBeUndefined();
    expect(value.TRUST_PROXY).toBe(1);
  });

  describe('B7 startup warnings (non-blocking)', () => {
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      warnSpy = jest.spyOn(Logger, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => warnSpy.mockRestore());

    it('warns without failing when the access lifetime exceeds 1h', () => {
      const { error } = envSchema.validate({
        ...validBase,
        JWT_ACCESS_TOKEN_EXPIRATION_TIME: 3601,
        JWT_REFRESH_TOKEN_EXPIRATION_TIME: 604800,
      });

      expect(error).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringMatching(/JWT_ACCESS_TOKEN_EXPIRATION_TIME/),
        'EnvValidation',
      );
    });

    it('warns without failing when the refresh lifetime exceeds 30 days', () => {
      const { error } = envSchema.validate({
        ...validBase,
        JWT_ACCESS_TOKEN_EXPIRATION_TIME: 900,
        JWT_REFRESH_TOKEN_EXPIRATION_TIME: 30 * 24 * 60 * 60 + 1,
      });

      expect(error).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringMatching(/JWT_REFRESH_TOKEN_EXPIRATION_TIME/),
        'EnvValidation',
      );
    });

    it('does not warn for lifetimes within the recommended bounds', () => {
      const { error } = envSchema.validate({
        ...validBase,
        JWT_ACCESS_TOKEN_EXPIRATION_TIME: 900,
        JWT_REFRESH_TOKEN_EXPIRATION_TIME: 604800,
      });

      expect(error).toBeUndefined();
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});
