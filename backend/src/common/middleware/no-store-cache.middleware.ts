import { NextFunction, Request, Response } from 'express';

/**
 * Every API response is authenticated or session-relevant (or becomes so
 * once a bearer token is attached), so none of it should be cached by an
 * intermediary. This is set defensively in the app itself because a
 * frontend-proxy rewrite (e.g. Netlify `[[headers]]`) is not guaranteed to
 * apply to proxied 200-rewrite responses.
 */
export function noStoreCacheMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  res.setHeader('Cache-Control', 'no-store');
  next();
}
