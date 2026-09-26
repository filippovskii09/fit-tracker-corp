import {
  HttpStatus,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

import {
  AUTH_SERVICE_UNAVAILABLE_CODE,
  RefreshErrorCode,
} from '../types/refresh-outcome.type';

/**
 * Terminal refresh/logout authentication failure. Carries a stable,
 * non-secret reason code per the auth contract.
 */
export class RefreshTerminalException extends UnauthorizedException {
  public readonly code: RefreshErrorCode;
  /**
   * True when the failure came from the legacy (no `sid`) refresh path.
   * A concurrent legacy request may have already upgraded the credential
   * into a brand new session and set a fresh scoped cookie; this failure
   * must not expire that unrelated, just-issued cookie.
   */
  public readonly isLegacy: boolean;

  constructor(code: RefreshErrorCode, message: string, isLegacy = false) {
    super({
      statusCode: HttpStatus.UNAUTHORIZED,
      error: 'Unauthorized',
      message,
      code,
    });
    this.code = code;
    this.isLegacy = isLegacy;
  }
}

export class AuthServiceUnavailableException extends ServiceUnavailableException {
  constructor(message = 'Authentication service is temporarily unavailable') {
    super({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      message,
      code: AUTH_SERVICE_UNAVAILABLE_CODE,
    });
  }
}
