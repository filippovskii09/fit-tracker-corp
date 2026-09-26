import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

export const REQUEST_ID_HEADER = 'X-Request-Id';
const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]{1,128}$/;

/**
 * Accepts a client-supplied `X-Request-Id` when it is a safe, bounded
 * token; otherwise generates one. Echoes it back and exposes it on the
 * request for correlation in structured logs.
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const provided = req.headers['x-request-id'];
  const candidate = Array.isArray(provided) ? provided[0] : provided;

  const requestId =
    candidate && SAFE_REQUEST_ID.test(candidate) ? candidate : randomUUID();

  (req as Request & { requestId: string }).requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);

  next();
}
