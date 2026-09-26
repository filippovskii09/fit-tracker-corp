import { Request, Response } from 'express';

import { noStoreCacheMiddleware } from '../no-store-cache.middleware';

describe('noStoreCacheMiddleware', () => {
  it('sets Cache-Control: no-store on every response and calls next', () => {
    const setHeader = jest.fn();
    const req = {} as Request;
    const res = { setHeader } as unknown as Response;
    const next = jest.fn();

    noStoreCacheMiddleware(req, res, next);

    expect(setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(next).toHaveBeenCalledTimes(1);
  });
});
