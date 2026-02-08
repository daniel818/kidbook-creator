// ============================================
// Analytics Module - Consolidated Client
// ============================================
// Provides Mixpanel integration for client-side event tracking
// Server-side tracking is in ./server.ts

'use client';

import mixpanel, { Dict } from 'mixpanel-browser';
import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';

// ============================================
// Event Constants
// ============================================

export const EVENTS = {
    // Session & Auth
    USER_SIGNED_UP: 'user_signed_up',
    USER_SIGNED_IN: 'user_signed_in',
    USER_SIGNED_OUT: 'user_signed_out',

    // Book Creation
    BOOK_CREATION_STARTED: 'book_creation_started',
    BOOK_CREATED: 'book_created',
    BOOK_CREATION_FAILED: 'book_creation_failed',

    // Book Viewing
    BOOK_VIEWED: 'book_viewed',

    // My Books & Orders
    MYBOOKS_VIEWED: 'mybooks_viewed',
    ORDERS_VIEWED: 'orders_viewed',

    // Checkout & Payment
    CHECKOUT_STARTED: 'checkout_started',
    PAYMENT_COMPLETED: 'payment_completed',
    PAYMENT_FAILED: 'payment_failed',
    ORDER_PLACED: 'order_placed',
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

// ============================================
// User Properties
// ============================================

export interface UserProperties {
    $email?: string;
    $name?: string;
    total_books_created?: number;
    total_books_purchased?: number;
    total_spent_usd?: number;
}

// ============================================
// Client Functions
// ============================================

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
        track_pageview: false,
        persistence: 'localStorage',
        ignore_dnt: false,
    });

    isInitialized = true;
    console.log('[Analytics] Mixpanel initialized');
}

/**
 * Track an event with optional properties
 */
export function track<T extends Dict>(event: EventName, properties?: T): void {
    if (!isInitialized) initAnalytics();

    if (!isInitialized) {
        if (process.env.NODE_ENV === 'development') {
            console.log('[Analytics] Event (not sent):', event, properties);
        }
        return;
    }

    const enrichedProps = {
        ...properties,
        timestamp: new Date().toISOString(),
        page_url: typeof window !== 'undefined' ? window.location.href : undefined,
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
    if (!isInitialized) initAnalytics();
    if (!isInitialized) return;

    mixpanel.identify(userId);
    if (traits) mixpanel.people.set(traits);

    if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics] Identified user:', userId);
    }
}

/**
 * Reset analytics (call on logout)
 */
export function resetAnalytics(): void {
    if (!isInitialized) return;
    mixpanel.reset();
}

// ============================================
// React Hooks
// ============================================

/**
 * Initialize analytics on mount (use in root layout)
 */
export function useAnalyticsInit(): void {
    useEffect(() => {
        initAnalytics();
    }, []);
}

/**
 * Identify user when auth state changes (use in root layout)
 */
export function useIdentify(): void {
    const { user } = useAuth();
    const identifiedRef = useRef<string | null>(null);

    useEffect(() => {
        if (user && user.id !== identifiedRef.current) {
            identify(user.id, {
                $email: user.email || undefined,
                $name: user.user_metadata?.full_name || undefined,
            });
            identifiedRef.current = user.id;
        } else if (!user && identifiedRef.current) {
            // Track logout before resetting
            track(EVENTS.USER_SIGNED_OUT, {});
            resetAnalytics();
            identifiedRef.current = null;
        }
    }, [user]);
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get entry point for create flow from referrer
 */
export function getEntryPoint(): 'homepage' | 'navbar' | 'mybooks' | 'unknown' {
    if (typeof window === 'undefined') return 'unknown';

    const referrer = document.referrer;
    if (referrer.includes('/mybooks')) return 'mybooks';
    if (referrer.endsWith('/') || referrer.includes('/?')) return 'homepage';

    return 'unknown';
}
