import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

import { uuidv7 } from 'uuidv7';

import { envSchema } from '@src/config/env.validation';
import { DBModule } from '@src/db/db.module';
import { WorkoutsModule } from '@src/workouts/workouts.module';
import { WorkoutsService } from '@src/workouts/workouts.service';
import { IdempotencyKeyReusedException } from '@src/workouts/exceptions/idempotency-key-reused.exception';
import { CreateWorkoutDto } from '@src/workouts/dto';

/**
 * Proves the workout create idempotency invariants (B9/B11) against the
 * real unique constraint on (userId, clientRequestId): a concurrent
 * duplicate submission with the same payload converges on one row, and a
 * concurrent submission with a different payload under the same key is
 * rejected instead of silently returning stale data.
 */
describe('workouts idempotency (PostgreSQL integration)', () => {
  let moduleRef: TestingModule;
  let workoutsService: WorkoutsService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, validationSchema: envSchema }),
        DBModule,
        WorkoutsModule,
      ],
    }).compile();

    workoutsService = moduleRef.get(WorkoutsService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('two concurrent creates with the same clientRequestId and payload converge on a single row', async () => {
    const userId = uuidv7();
    const clientRequestId = uuidv7();
    const dto: CreateWorkoutDto = {
      name: 'Leg Day',
      date: '2024-01-01',
      clientRequestId,
      exercises: [],
    };

    const [a, b] = await Promise.all([
      workoutsService.create(dto, userId),
      workoutsService.create(dto, userId),
    ]);

    expect(a.id).toBe(b.id);
  });

  it('a concurrent duplicate with a different payload under the same key is rejected (409)', async () => {
    const userId = uuidv7();
    const clientRequestId = uuidv7();
    const dtoA: CreateWorkoutDto = {
      name: 'Leg Day',
      date: '2024-01-01',
      clientRequestId,
      exercises: [],
    };
    const dtoB: CreateWorkoutDto = {
      name: 'Push Day',
      date: '2024-01-02',
      clientRequestId,
      exercises: [],
    };

    const results = await Promise.allSettled([
      workoutsService.create(dtoA, userId),
      workoutsService.create(dtoB, userId),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(
      IdempotencyKeyReusedException,
    );
  });
});
