// ============================================
// In-Memory Rate Limiter (Sliding Window)
// ============================================
// Simple rate limiter for API routes. Uses in-memory storage,
// suitable for single-instance deployments. For multi-instance,
// replace with Redis-based implementation.

interface RateLimitEntry {
    timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
    lastCleanup = now;

    const cutoff = now - windowMs;
    for (const [key, entry] of store.entries()) {
        entry.timestamps = entry.timestamps.filter(t => t > cutoff);
        if (entry.timestamps.length === 0) {
            store.delete(key);
        }
    }
}

export interface RateLimitConfig {
    /** Time window in milliseconds */
    windowMs: number;
    /** Maximum number of requests per window */
    maxRequests: number;
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    limit: number;
}

/**
 * Pre-configured rate limit tiers for different API route categories.
 */
export const RATE_LIMITS = {
    /** AI generation routes (expensive) — 5 requests per minute */
    ai: { windowMs: 60_000, maxRequests: 5 } as RateLimitConfig,

    /** Standard API routes — 30 requests per minute */
    standard: { windowMs: 60_000, maxRequests: 30 } as RateLimitConfig,

    /** Auth-related routes — 10 requests per minute */
    auth: { windowMs: 60_000, maxRequests: 10 } as RateLimitConfig,

    /** Checkout/payment routes — 10 requests per minute */
    checkout: { windowMs: 60_000, maxRequests: 10 } as RateLimitConfig,

    /** Upload routes — 10 requests per minute */
    upload: { windowMs: 60_000, maxRequests: 10 } as RateLimitConfig,
} as const;

/**
 * Check rate limit for a given identifier (typically user ID or IP).
 *
 * @param identifier - Unique key (user ID, IP, etc.)
 * @param config - Rate limit configuration
 * @returns Whether the request is allowed plus metadata
 */
export function checkRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Periodic cleanup
    cleanup(config.windowMs);

    let entry = store.get(identifier);
    if (!entry) {
        entry = { timestamps: [] };
        store.set(identifier, entry);
    }

    // Remove timestamps outside the current window
    entry.timestamps = entry.timestamps.filter(t => t > windowStart);

    if (entry.timestamps.length >= config.maxRequests) {
        // Rate limited
        const oldestInWindow = entry.timestamps[0];
        return {
            allowed: false,
            remaining: 0,
            resetAt: oldestInWindow + config.windowMs,
            limit: config.maxRequests,
        };
    }

    // Allow and record
    entry.timestamps.push(now);

    return {
        allowed: true,
        remaining: config.maxRequests - entry.timestamps.length,
        resetAt: now + config.windowMs,
        limit: config.maxRequests,
    };
}

/**
 * Helper to add rate limit headers to a Response.
 */
export function addRateLimitHeaders(headers: Headers, result: RateLimitResult): void {
    headers.set('X-RateLimit-Limit', String(result.limit));
    headers.set('X-RateLimit-Remaining', String(result.remaining));
    headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));
}
