// ============================================
// Mixpanel Analytics Client
// ============================================

import mixpanel, { Dict } from 'mixpanel-browser';
import { EVENTS, EventName } from './constants';
import type { UserProperties } from './events';

// Singleton initialization flag
let isInitialized = false;

/**
 * Initialize Mixpanel. Safe to call multiple times.
 */
export function initAnalytics(): void {
    if (isInitialized) return;
    if (typeof window === 'undefined') return;

    const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
    if (!token) {
        console.warn('[Analytics] NEXT_PUBLIC_MIXPANEL_TOKEN not set');
        return;
    }

    mixpanel.init(token, {
        debug: process.env.NODE_ENV === 'development',
        track_pageview: false, // We handle this manually
        persistence: 'localStorage',
        ignore_dnt: false,
    });

    isInitialized = true;
    console.log('[Analytics] Mixpanel initialized');
}

/**
 * Track an event with properties
 */
export function track<T extends Dict>(event: EventName, properties?: T): void {
    if (!isInitialized) {
        initAnalytics();
    }

    if (!isInitialized) {
        // Still not initialized (no token), log to console in dev
        if (process.env.NODE_ENV === 'development') {
            console.log('[Analytics] Event (not sent):', event, properties);
        }
        return;
    }

    // Add common properties
    const enrichedProps = {
        ...properties,
        timestamp: new Date().toISOString(),
        page_url: typeof window !== 'undefined' ? window.location.href : undefined,
        page_path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    };

    mixpanel.track(event, enrichedProps);

    if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics] Tracked:', event, enrichedProps);
    }
}

/**
 * Identify a user (call after login/signup)
 */
export function identify(userId: string, traits?: UserProperties): void {
    if (!isInitialized) {
        initAnalytics();
    }

    if (!isInitialized) return;

    mixpanel.identify(userId);

    if (traits) {
        mixpanel.people.set(traits);
    }

    if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics] Identified user:', userId, traits);
    }
}

/**
 * Set user properties without identifying
 */
export function setUserProperties(properties: UserProperties): void {
    if (!isInitialized) return;
    mixpanel.people.set(properties);
}

/**
 * Increment a numeric user property
 */
export function incrementUserProperty(property: keyof UserProperties, amount = 1): void {
    if (!isInitialized) return;
    mixpanel.people.increment(property as string, amount);
}

/**
 * Reset analytics (call on logout)
 */
export function resetAnalytics(): void {
    if (!isInitialized) return;
    mixpanel.reset();

    if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics] Reset (user logged out)');
    }
}

/**
 * Get a unique session ID for this browser session
 */
export function getSessionId(): string | undefined {
    if (!isInitialized) return undefined;
    return mixpanel.get_distinct_id();
}

// Re-export for convenience
export { EVENTS };
