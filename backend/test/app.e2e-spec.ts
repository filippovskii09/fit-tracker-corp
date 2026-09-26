import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '@src/app/app.module';
import { requestIdMiddleware } from '@src/common/middleware/request-id.middleware';
import { noStoreCacheMiddleware } from '@src/common/middleware/no-store-cache.middleware';

/**
 * Boots the real application (same global pipes/middleware/prefix as
 * production main.ts) against real PostgreSQL, so routing, validation,
 * cookies, and per-route cache headers are proven through the actual HTTP
 * boundary instead of a mocked controller call.
 */
describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(requestIdMiddleware);
    app.use(noStoreCacheMiddleware);
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/exercises is cacheable for the public catalog, overriding the global no-store default', async () => {
    const response = await request(app.getHttpServer()).get(
      '/api/v1/exercises',
    );

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('public, max-age=300');
  });

  it('GET /api/v1/users/me without a bearer token is rejected with no-store still applied', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/users/me');

    expect(response.status).toBe(401);
    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('POST /api/v1/auth/refresh without a cookie returns the documented terminal shape', async () => {
    const response = await request(app.getHttpServer()).post(
      '/api/v1/auth/refresh',
    );

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      statusCode: 401,
      code: 'REFRESH_COOKIE_MISSING',
    });
  });

  describe('workout create validation and idempotency (through the real auth + validation pipeline)', () => {
    let accessToken: string;

    beforeAll(async () => {
      const email = `e2e-${Date.now()}@example.com`;
      const password = 'Str0ng!Passw0rd';

      await request(app.getHttpServer()).post('/api/v1/auth/register').send({
        email,
        password,
        firstName: 'E2E',
      });

      const signInResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/signin')
        .send({ email, password });

      accessToken = signInResponse.body.accessToken;
    });

    it('rejects a workout name over the documented MaxLength(100)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/workouts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'x'.repeat(101),
          date: '2024-01-01',
          exercises: [],
        });

      expect(response.status).toBe(400);
    });

    it('returns 201 for a repeated clientRequestId with the same payload, and 409 with a different one', async () => {
      const clientRequestId = 'aaaaaaaa-1111-4111-8111-111111111111';
      const payload = {
        name: 'Leg Day',
        date: '2024-01-01',
        clientRequestId,
        exercises: [],
      };

      const first = await request(app.getHttpServer())
        .post('/api/v1/workouts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload);
      expect(first.status).toBe(201);

      const repeatSamePayload = await request(app.getHttpServer())
        .post('/api/v1/workouts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload);
      expect(repeatSamePayload.status).toBe(201);
      expect(repeatSamePayload.body.id).toBe(first.body.id);

      const repeatDifferentPayload = await request(app.getHttpServer())
        .post('/api/v1/workouts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...payload, name: 'Push Day' });
      expect(repeatDifferentPayload.status).toBe(409);
      expect(repeatDifferentPayload.body).toMatchObject({
        code: 'IDEMPOTENCY_KEY_REUSED',
        workoutId: first.body.id,
      });
    });
  });
});
