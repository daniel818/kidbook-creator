/**
 * @jest-environment node
 */
// ============================================
// Unit Tests for Rate Limiter
// ============================================

import { checkRateLimit, addRateLimitHeaders, rateLimitResponse, getClientIp, RATE_LIMITS, RateLimitConfig } from '@/lib/rate-limit';

// Reset the internal store between tests by re-importing fresh module
// Since the store is module-scoped, we use a workaround by using unique keys per test

describe('checkRateLimit', () => {
    const testConfig: RateLimitConfig = { windowMs: 1000, maxRequests: 3 };

    it('allows requests within the limit', () => {
        const key = `test-allow-${Date.now()}`;
        const result1 = checkRateLimit(key, testConfig);
        expect(result1.allowed).toBe(true);
        expect(result1.remaining).toBe(2);
        expect(result1.limit).toBe(3);
        expect(result1.retryAfterSeconds).toBe(0);
    });

    it('tracks remaining requests correctly', () => {
        const key = `test-remaining-${Date.now()}`;
        const r1 = checkRateLimit(key, testConfig);
        expect(r1.remaining).toBe(2);

        const r2 = checkRateLimit(key, testConfig);
        expect(r2.remaining).toBe(1);

        const r3 = checkRateLimit(key, testConfig);
        expect(r3.remaining).toBe(0);
    });

    it('blocks requests when limit is exceeded', () => {
        const key = `test-block-${Date.now()}`;
        // Exhaust the limit
        checkRateLimit(key, testConfig);
        checkRateLimit(key, testConfig);
        checkRateLimit(key, testConfig);

        // Fourth request should be blocked
        const result = checkRateLimit(key, testConfig);
        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
        expect(result.retryAfterSeconds).toBeGreaterThanOrEqual(1);
    });

    it('provides a valid resetAt timestamp', () => {
        const key = `test-resetAt-${Date.now()}`;
        const before = Date.now();
        const result = checkRateLimit(key, testConfig);
        const after = Date.now();

        // resetAt should be within windowMs of now
        expect(result.resetAt).toBeGreaterThanOrEqual(before + testConfig.windowMs);
        expect(result.resetAt).toBeLessThanOrEqual(after + testConfig.windowMs);
    });

    it('resets after the window expires', async () => {
        const shortConfig: RateLimitConfig = { windowMs: 50, maxRequests: 1 };
        const key = `test-reset-${Date.now()}`;

        const r1 = checkRateLimit(key, shortConfig);
        expect(r1.allowed).toBe(true);

        const r2 = checkRateLimit(key, shortConfig);
        expect(r2.allowed).toBe(false);

        // Wait for window to expire
        await new Promise(resolve => setTimeout(resolve, 60));

        const r3 = checkRateLimit(key, shortConfig);
        expect(r3.allowed).toBe(true);
    });

    it('isolates different identifiers', () => {
        const key1 = `test-isolate-a-${Date.now()}`;
        const key2 = `test-isolate-b-${Date.now()}`;
        const config: RateLimitConfig = { windowMs: 1000, maxRequests: 1 };

        checkRateLimit(key1, config);
        // key1 is now at limit

        const result = checkRateLimit(key2, config);
        expect(result.allowed).toBe(true); // key2 should be independent
    });

    it('retryAfterSeconds is at least 1 when blocked', () => {
        const key = `test-retry-${Date.now()}`;
        const config: RateLimitConfig = { windowMs: 60000, maxRequests: 1 };

        checkRateLimit(key, config);
        const result = checkRateLimit(key, config);
        expect(result.allowed).toBe(false);
        expect(result.retryAfterSeconds).toBeGreaterThanOrEqual(1);
        expect(result.retryAfterSeconds).toBeLessThanOrEqual(60);
    });
});

describe('RATE_LIMITS', () => {
    it('defines all expected tiers', () => {
        expect(RATE_LIMITS.ai).toBeDefined();
        expect(RATE_LIMITS.standard).toBeDefined();
        expect(RATE_LIMITS.auth).toBeDefined();
        expect(RATE_LIMITS.checkout).toBeDefined();
        expect(RATE_LIMITS.upload).toBeDefined();
    });

    it('AI tier is the most restrictive', () => {
        expect(RATE_LIMITS.ai.maxRequests).toBeLessThan(RATE_LIMITS.standard.maxRequests);
    });

    it('all tiers have valid window and maxRequests', () => {
        for (const [, config] of Object.entries(RATE_LIMITS)) {
            expect(config.windowMs).toBeGreaterThan(0);
            expect(config.maxRequests).toBeGreaterThan(0);
        }
    });
});

describe('addRateLimitHeaders', () => {
    it('sets X-RateLimit-* headers on allowed responses', () => {
        const headers = new Headers();
        addRateLimitHeaders(headers, {
            allowed: true,
            remaining: 4,
            resetAt: 1700000000000,
            retryAfterSeconds: 0,
            limit: 5,
        });

        expect(headers.get('X-RateLimit-Limit')).toBe('5');
        expect(headers.get('X-RateLimit-Remaining')).toBe('4');
        expect(headers.get('X-RateLimit-Reset')).toBe('1700000000');
        expect(headers.get('Retry-After')).toBeNull(); // Not set for allowed requests
    });

    it('sets Retry-After header on blocked responses', () => {
        const headers = new Headers();
        addRateLimitHeaders(headers, {
            allowed: false,
            remaining: 0,
            resetAt: 1700000060000,
            retryAfterSeconds: 45,
            limit: 5,
        });

        expect(headers.get('X-RateLimit-Limit')).toBe('5');
        expect(headers.get('X-RateLimit-Remaining')).toBe('0');
        expect(headers.get('Retry-After')).toBe('45');
    });
});

describe('rateLimitResponse', () => {
    it('returns a 429 response with headers', () => {
        const response = rateLimitResponse({
            allowed: false,
            remaining: 0,
            resetAt: Date.now() + 30000,
            retryAfterSeconds: 30,
            limit: 5,
        });

        expect(response.status).toBe(429);
        expect(response.headers.get('Retry-After')).toBe('30');
        expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
    });

    it('uses default message when none provided', async () => {
        const response = rateLimitResponse({
            allowed: false,
            remaining: 0,
            resetAt: Date.now() + 30000,
            retryAfterSeconds: 30,
            limit: 5,
        });

        const body = await response.json();
        expect(body.error).toBe('Too many requests. Please wait before trying again.');
    });

    it('accepts a custom message', async () => {
        const response = rateLimitResponse(
            {
                allowed: false,
                remaining: 0,
                resetAt: Date.now() + 30000,
                retryAfterSeconds: 30,
                limit: 5,
            },
            'Custom rate limit message'
        );

        const body = await response.json();
        expect(body.error).toBe('Custom rate limit message');
    });
});

describe('getClientIp', () => {
    it('extracts IP from X-Forwarded-For header', () => {
        const request = {
            headers: {
                get: (name: string) => name === 'x-forwarded-for' ? '1.2.3.4, 5.6.7.8' : null,
            },
        };
        expect(getClientIp(request)).toBe('1.2.3.4');
    });

    it('extracts IP from X-Real-IP header', () => {
        const request = {
            headers: {
                get: (name: string) => name === 'x-real-ip' ? '10.0.0.1' : null,
            },
        };
        expect(getClientIp(request)).toBe('10.0.0.1');
    });

    it('prefers X-Forwarded-For over X-Real-IP', () => {
        const request = {
            headers: {
                get: (name: string) => {
                    if (name === 'x-forwarded-for') return '1.2.3.4';
                    if (name === 'x-real-ip') return '10.0.0.1';
                    return null;
                },
            },
        };
        expect(getClientIp(request)).toBe('1.2.3.4');
    });

    it('returns "unknown" when no IP headers present', () => {
        const request = {
            headers: {
                get: () => null,
            },
        };
        expect(getClientIp(request)).toBe('unknown');
    });
});
