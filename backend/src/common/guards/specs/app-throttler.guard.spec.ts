import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerException, ThrottlerLimitDetail } from '@nestjs/throttler';

import { RefreshErrorCode } from '@src/auth/types';
import { AppThrottlerGuard } from '../app-throttler.guard';

describe('AppThrottlerGuard', () => {
  const buildContext = (path: string, requestId?: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ path, requestId }),
        getResponse: () => ({}),
      }),
      getClass: () => ({ name: 'AuthController' }) as unknown,
      getHandler: () => ({ name: 'refreshToken' }) as unknown,
    }) as unknown as ExecutionContext;

  const buildDetail = (
    overrides: Partial<ThrottlerLimitDetail> = {},
  ): ThrottlerLimitDetail =>
    ({
      limit: 20,
      ttl: 60000,
      key: 'key',
      tracker: 'tracker',
      totalHits: 21,
      timeToExpire: 30,
      isBlocked: true,
      timeToBlockExpire: 42,
      ...overrides,
    }) as ThrottlerLimitDetail;

  const createGuard = () =>
    new AppThrottlerGuard(
      [{ name: 'default', ttl: 60000, limit: 100 }],
      { increment: jest.fn() } as never,
      new Reflector(),
    );

  it('emits a 429 with the refresh reason code and logs it, without a default guard fallback', async () => {
    const guard = createGuard();
    const logSpy = jest
      .spyOn(
        (guard as unknown as { logger: { warn: jest.Mock } }).logger,
        'warn',
      )
      .mockImplementation(() => undefined);

    const context = buildContext('/api/v1/auth/refresh', 'req-123');
    const detail = buildDetail();

    const throwFn = (
      guard as unknown as {
        throwThrottlingException: (
          ctx: ExecutionContext,
          d: ThrottlerLimitDetail,
        ) => Promise<void>;
      }
    ).throwThrottlingException.bind(guard);

    await expect(throwFn(context, detail)).rejects.toMatchObject({
      status: 429,
      response: expect.objectContaining({
        code: RefreshErrorCode.REFRESH_RATE_LIMITED,
        retryAfterSeconds: 42,
      }),
    });

    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'auth.refresh.rate_limited',
        requestId: 'req-123',
        code: RefreshErrorCode.REFRESH_RATE_LIMITED,
        retryAfterSeconds: 42,
      }),
    );

    const loggedArgs = JSON.stringify(logSpy.mock.calls);
    expect(loggedArgs).not.toMatch(/refresh[tT]oken|password|authorization/i);
  });

  it('falls back to the default ThrottlerException for non-refresh routes', async () => {
    const guard = createGuard();
    const context = buildContext('/api/v1/workouts');
    const detail = buildDetail();

    const throwFn = (
      guard as unknown as {
        throwThrottlingException: (
          ctx: ExecutionContext,
          d: ThrottlerLimitDetail,
        ) => Promise<void>;
      }
    ).throwThrottlingException.bind(guard);

    await expect(throwFn(context, detail)).rejects.toBeInstanceOf(
      ThrottlerException,
    );
  });
});
