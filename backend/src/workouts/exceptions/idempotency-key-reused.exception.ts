import { ConflictException, HttpStatus } from '@nestjs/common';

/**
 * Same user + same `clientRequestId` presented with a different payload
 * than the one originally stored under that key.
 */
export class IdempotencyKeyReusedException extends ConflictException {
  constructor(message: string, workoutId: string) {
    super({
      statusCode: HttpStatus.CONFLICT,
      message,
      code: 'IDEMPOTENCY_KEY_REUSED',
      workoutId,
    });
  }
}
