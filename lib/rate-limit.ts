// ============================================
// In-Memory Rate Limiter (Sliding Window)
// ============================================
// Simple rate limiter for API routes using in-memory storage.
//
// ⚠️  SERVERLESS LIMITATION: On Vercel/serverless platforms, each function
// invocation may run in a separate instance with its own memory. The in-memory
// store does NOT persist across cold starts or instances, so rate limiting is
// best-effort in serverless environments. For strict enforcement, replace the
// Map-based store with a shared store (e.g., Vercel KV / Upstash Redis).
//
// In single-instance deployments (Docker, VPS, long-running Node server),
// this works reliably as all requests share the same process memory.

interface RateLimitEntry {
    timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

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
    retryAfterSeconds: number;
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

// Use the largest configured window for cleanup so we never
// prematurely evict entries that belong to a longer window.
const MAX_WINDOW_MS = Math.max(...Object.values(RATE_LIMITS).map(r => r.windowMs));

function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
    lastCleanup = now;

    const cutoff = now - MAX_WINDOW_MS;
    for (const [key, entry] of store.entries()) {
        entry.timestamps = entry.timestamps.filter(t => t > cutoff);
        if (entry.timestamps.length === 0) {
            store.delete(key);
        }
    }
}

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
    cleanup();

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
        const resetAt = oldestInWindow + config.windowMs;
        const retryAfterSeconds = Math.ceil((resetAt - now) / 1000);
        return {
            allowed: false,
            remaining: 0,
            resetAt,
            retryAfterSeconds: Math.max(1, retryAfterSeconds),
            limit: config.maxRequests,
        };
    }

    // Allow and record
    entry.timestamps.push(now);

    // resetAt = when the oldest request in the window will expire (consistent with blocked path)
    const oldestTimestamp = entry.timestamps[0];
    const resetAt = oldestTimestamp + config.windowMs;
    return {
        allowed: true,
        remaining: config.maxRequests - entry.timestamps.length,
        resetAt,
        retryAfterSeconds: 0,
        limit: config.maxRequests,
    };
}

/**
 * Helper to add rate limit headers to a Response.
 * Includes standard X-RateLimit-* headers and Retry-After (on 429).
 */
export function addRateLimitHeaders(headers: Headers, result: RateLimitResult): void {
    headers.set('X-RateLimit-Limit', String(result.limit));
    headers.set('X-RateLimit-Remaining', String(result.remaining));
    headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));
    if (!result.allowed) {
        headers.set('Retry-After', String(result.retryAfterSeconds));
    }
}

/**
 * Extract a client identifier from a request (IP address or fallback).
 * Uses standard proxy headers (X-Forwarded-For, X-Real-IP) for deployments behind a reverse proxy.
 */
export function getClientIp(request: { headers: { get(name: string): string | null } }): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        // x-forwarded-for can be comma-separated; take the first (client) IP
        return forwarded.split(',')[0].trim();
    }
    return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Helper to create a standard 429 rate limit response with proper headers and logging.
 */
export function rateLimitResponse(
    rateResult: RateLimitResult,
    message = 'Too many requests. Please wait before trying again.'
): Response {
    const response = Response.json(
        { error: message },
        { status: 429 }
    );
    addRateLimitHeaders(response.headers, rateResult);
    return response;
}
