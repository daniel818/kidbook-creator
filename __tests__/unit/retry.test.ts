import { withRetry, HttpError, getStatusCode, RetryConfig } from '@/lib/retry';

// Use tiny delays for fast tests
const testConfig: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1,
  maxDelayMs: 10,
  retryableStatusCodes: [429, 500, 503],
  serviceLabel: 'Test',
};

describe('retry utility', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('withRetry', () => {
    it('should return result on first success', async () => {
      const fn = jest.fn().mockResolvedValue('ok');
      const result = await withRetry(fn, testConfig);

      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable status codes and succeed', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new HttpError('rate limited', 429))
        .mockRejectedValueOnce(new HttpError('server error', 503))
        .mockResolvedValue('recovered');

      const result = await withRetry(fn, testConfig);

      expect(result).toBe('recovered');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after exhausting all retries', async () => {
      const error = new HttpError('always fails', 503);
      const fn = jest.fn().mockRejectedValue(error);

      await expect(withRetry(fn, testConfig)).rejects.toThrow('always fails');
      // 1 initial + 3 retries = 4 total calls
      expect(fn).toHaveBeenCalledTimes(4);
    });

    it('should fail immediately on non-retryable 400', async () => {
      const fn = jest.fn().mockRejectedValue(new HttpError('bad request', 400));

      await expect(withRetry(fn, testConfig)).rejects.toThrow('bad request');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should fail immediately on non-retryable 401', async () => {
      const fn = jest.fn().mockRejectedValue(new HttpError('unauthorized', 401));

      await expect(withRetry(fn, testConfig)).rejects.toThrow('unauthorized');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should fail immediately on non-retryable 403', async () => {
      const fn = jest.fn().mockRejectedValue(new HttpError('forbidden', 403));

      await expect(withRetry(fn, testConfig)).rejects.toThrow('forbidden');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should fail immediately on non-retryable 404', async () => {
      const fn = jest.fn().mockRejectedValue(new HttpError('not found', 404));

      await expect(withRetry(fn, testConfig)).rejects.toThrow('not found');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should fail immediately on non-retryable 422', async () => {
      const fn = jest.fn().mockRejectedValue(new HttpError('unprocessable', 422));

      await expect(withRetry(fn, testConfig)).rejects.toThrow('unprocessable');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on network errors', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('fetch failed'))
        .mockResolvedValue('recovered');

      const result = await withRetry(fn, testConfig);

      expect(result).toBe('recovered');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry on ECONNRESET', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValue('ok');

      const result = await withRetry(fn, testConfig);
      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry on ETIMEDOUT', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('connect ETIMEDOUT'))
        .mockResolvedValue('ok');

      const result = await withRetry(fn, testConfig);
      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should fail immediately on unknown non-network errors', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('JSON parse error'));

      await expect(withRetry(fn, testConfig)).rejects.toThrow('JSON parse error');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should log retry attempts', async () => {
      const warnSpy = jest.spyOn(console, 'warn');
      const fn = jest.fn()
        .mockRejectedValueOnce(new HttpError('rate limited', 429))
        .mockResolvedValue('ok');

      await withRetry(fn, testConfig);

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Retry: Test]')
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('(status: 429)')
      );
    });

    it('should work with maxRetries of 0 (no retries)', async () => {
      const config: RetryConfig = { ...testConfig, maxRetries: 0 };
      const fn = jest.fn().mockRejectedValue(new HttpError('fail', 503));

      await expect(withRetry(fn, config)).rejects.toThrow('fail');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should not retry status codes not in retryableStatusCodes', async () => {
      const fn = jest.fn().mockRejectedValue(new HttpError('bad gateway', 502));

      // 502 is NOT in testConfig.retryableStatusCodes
      await expect(withRetry(fn, testConfig)).rejects.toThrow('bad gateway');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('HttpError', () => {
    it('should preserve statusCode', () => {
      const error = new HttpError('test error', 503);
      expect(error.statusCode).toBe(503);
      expect(error.message).toBe('test error');
      expect(error.name).toBe('HttpError');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('getStatusCode', () => {
    it('should extract from statusCode property', () => {
      expect(getStatusCode({ statusCode: 429, message: 'rate limited' })).toBe(429);
    });

    it('should extract from status property', () => {
      expect(getStatusCode({ status: 500 })).toBe(500);
    });

    it('should extract from httpStatusCode property', () => {
      expect(getStatusCode({ httpStatusCode: 503 })).toBe(503);
    });

    it('should extract from nested response.status', () => {
      expect(getStatusCode({ response: { status: 502 } })).toBe(502);
    });

    it('should extract from error message string', () => {
      expect(getStatusCode(new Error('Lulu API error: 503 - Service Unavailable'))).toBe(503);
    });

    it('should extract from plain string', () => {
      expect(getStatusCode('HTTP 429 Too Many Requests')).toBe(429);
    });

    it('should return undefined for null/undefined', () => {
      expect(getStatusCode(null)).toBeUndefined();
      expect(getStatusCode(undefined)).toBeUndefined();
    });

    it('should return undefined when no status found', () => {
      expect(getStatusCode(new Error('something went wrong'))).toBeUndefined();
    });

    it('should prefer direct property over message parsing', () => {
      const error = new HttpError('error 500 happened', 429);
      expect(getStatusCode(error)).toBe(429);
    });
  });
});
