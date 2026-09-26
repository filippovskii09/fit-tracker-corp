import axios from 'axios';
import { classifyRefreshError } from '../classify-refresh-error';

const mockedIsAxiosError = axios.isAxiosError as unknown as jest.Mock;

interface FakeAxiosError {
  response?: {
    status: number;
    data?: unknown;
    headers?: Record<string, string>;
  };
}

const buildAxiosError = (
  status: number,
  data?: unknown,
  headers?: Record<string, string>,
): FakeAxiosError => ({
  response: { status, data, headers: headers ?? {} },
});

describe('classifyRefreshError', () => {
  beforeEach(() => {
    mockedIsAxiosError.mockReset();
  });

  it('classifies a non-axios error as transient (no response identifiable)', () => {
    mockedIsAxiosError.mockReturnValue(false);
    expect(classifyRefreshError(new Error('boom'))).toEqual({
      status: 'transient',
      reason: 'network',
    });
  });

  it('classifies an axios error without a response as transient network', () => {
    mockedIsAxiosError.mockReturnValue(true);
    expect(classifyRefreshError({})).toEqual({
      status: 'transient',
      reason: 'network',
    });
  });

  it('classifies 429 as transient rate limited with retryAfterSeconds from the header', () => {
    mockedIsAxiosError.mockReturnValue(true);
    const error = buildAxiosError(
      429,
      { code: 'REFRESH_RATE_LIMITED' },
      { 'retry-after': '30' },
    );
    expect(classifyRefreshError(error)).toEqual({
      status: 'transient',
      reason: 'rate_limited',
      retryAfterSeconds: 30,
    });
  });

  it('classifies 429 with a body-only retryAfterSeconds', () => {
    mockedIsAxiosError.mockReturnValue(true);
    const error = buildAxiosError(429, { retryAfterSeconds: 12 });
    expect(classifyRefreshError(error)).toEqual({
      status: 'transient',
      reason: 'rate_limited',
      retryAfterSeconds: 12,
    });
  });

  it('classifies 5xx as transient server_error', () => {
    mockedIsAxiosError.mockReturnValue(true);
    const error = buildAxiosError(503, { code: 'AUTH_SERVICE_UNAVAILABLE' });
    expect(classifyRefreshError(error)).toEqual({
      status: 'transient',
      reason: 'server_error',
    });
  });

  it('classifies a 401 with a known code as terminal', () => {
    mockedIsAxiosError.mockReturnValue(true);
    const error = buildAxiosError(401, { code: 'SESSION_REVOKED' });
    expect(classifyRefreshError(error)).toEqual({
      status: 'terminal',
      code: 'SESSION_REVOKED',
    });
  });

  it('classifies a 403 with a known code as terminal', () => {
    mockedIsAxiosError.mockReturnValue(true);
    const error = buildAxiosError(403, { code: 'REFRESH_REPLAYED' });
    expect(classifyRefreshError(error)).toEqual({
      status: 'terminal',
      code: 'REFRESH_REPLAYED',
    });
  });

  it('fails closed as UNKNOWN for a malformed 401 (missing/unknown code)', () => {
    mockedIsAxiosError.mockReturnValue(true);
    const error = buildAxiosError(401, { message: 'nope' });
    expect(classifyRefreshError(error)).toEqual({
      status: 'terminal',
      code: 'UNKNOWN',
    });
  });

  it.each([400, 404, 405, 408, 418])(
    'treats any other 4xx status (%d) as transient, not terminal',
    (status) => {
      mockedIsAxiosError.mockReturnValue(true);
      const error = buildAxiosError(status);
      expect(classifyRefreshError(error)).toEqual({
        status: 'transient',
        reason: 'unexpected_status',
      });
    },
  );

  describe.each([401, 403])(
    'fails closed as UNKNOWN for every malformed %d body',
    (status) => {
      it.each([
        ['an unrecognized code', { code: 'NOT_A_REAL_CODE' }],
        ['no body at all', undefined],
        ['a non-string code', { code: 42 }],
      ])('%s', (_label, data) => {
        mockedIsAxiosError.mockReturnValue(true);
        const error = buildAxiosError(status, data);
        expect(classifyRefreshError(error)).toEqual({
          status: 'terminal',
          code: 'UNKNOWN',
        });
      });
    },
  );
});
