// ============================================
// Retry Utility with Exponential Backoff
// ============================================
// Generic retry logic for external API calls (Gemini, Lulu, Resend, Supabase Storage)

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  retryableStatusCodes: number[];
  serviceLabel: string;
}

export class HttpError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = 'HttpError';
  }
}

const NON_RETRYABLE_STATUS_CODES = [400, 401, 403, 404, 422];

const NETWORK_ERROR_PATTERNS = [
  'econnreset',
  'etimedout',
  'econnrefused',
  'fetch failed',
  'network error',
  'socket hang up',
  'enotfound',
  'epipe',
];

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateDelay(attempt: number, config: RetryConfig): number {
  const baseDelay = config.initialDelayMs * Math.pow(2, attempt);
  const cappedDelay = Math.min(baseDelay, config.maxDelayMs);
  const jitter = Math.random() * cappedDelay * 0.25;
  return Math.round(cappedDelay + jitter);
}

export function getStatusCode(error: unknown): number | undefined {
  if (error == null) return undefined;

  if (typeof error === 'object') {
    const e = error as Record<string, unknown>;
    for (const key of ['statusCode', 'status', 'httpStatusCode']) {
      const val = e[key];
      if (typeof val === 'number' && val >= 100 && val < 600) return val;
    }
    if (e.response && typeof e.response === 'object') {
      const resp = e.response as Record<string, unknown>;
      if (typeof resp.status === 'number') return resp.status;
    }
  }

  const message = error instanceof Error ? error.message : String(error);
  const match = message.match(/\b([45]\d{2})\b/);
  if (match) return parseInt(match[1], 10);

  return undefined;
}

function isNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  return NETWORK_ERROR_PATTERNS.some(p => lower.includes(p));
}

function isRetryable(error: unknown, config: RetryConfig): boolean {
  const status = getStatusCode(error);

  if (status !== undefined) {
    if (NON_RETRYABLE_STATUS_CODES.includes(status)) return false;
    return config.retryableStatusCodes.includes(status);
  }

  return isNetworkError(error);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === config.maxRetries) break;

      if (!isRetryable(error, config)) throw error;

      const delay = calculateDelay(attempt, config);
      const status = getStatusCode(error);
      console.warn(
        `[Retry: ${config.serviceLabel}] Attempt ${attempt + 2}/${config.maxRetries + 1} after ${delay}ms` +
        (status ? ` (status: ${status})` : '') +
        ` — ${error instanceof Error ? error.message : String(error)}`
      );

      await sleep(delay);
    }
  }

  throw lastError;
}

export const RETRY_CONFIGS = {
  gemini: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 15000,
    retryableStatusCodes: [429, 500, 503],
    serviceLabel: 'Gemini',
  },
  lulu: {
    maxRetries: 3,
    initialDelayMs: 2000,
    maxDelayMs: 30000,
    retryableStatusCodes: [429, 500, 502, 503],
    serviceLabel: 'Lulu',
  },
  resend: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 15000,
    retryableStatusCodes: [429, 500, 503],
    serviceLabel: 'Resend',
  },
  supabaseStorage: {
    maxRetries: 2,
    initialDelayMs: 500,
    maxDelayMs: 5000,
    retryableStatusCodes: [500, 503],
    serviceLabel: 'Supabase Storage',
  },
} as const satisfies Record<string, RetryConfig>;
