import {
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';

import { RefreshErrorCode } from '@src/auth/types';
import { ResponseMessages } from '@src/common/messages';

/**
 * Extends the default throttler exception with the refresh endpoint's
 * structured transient-error contract (429 + reason code + retryAfterSeconds)
 * while leaving throttling behavior for every other route unchanged.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(AppThrottlerGuard.name);

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const request = context.switchToHttp().getRequest();

    if (request?.path?.endsWith('/auth/refresh')) {
      const retryAfterSeconds = throttlerLimitDetail.timeToBlockExpire;

      this.logger.warn({
        event: 'auth.refresh.rate_limited',
        requestId: request?.requestId,
        code: RefreshErrorCode.REFRESH_RATE_LIMITED,
        retryAfterSeconds,
      });

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: ResponseMessages.Auth.RefreshRateLimited,
          code: RefreshErrorCode.REFRESH_RATE_LIMITED,
          retryAfterSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return super.throwThrottlingException(context, throttlerLimitDetail);
  }
}
