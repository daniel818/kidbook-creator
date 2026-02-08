// ============================================
// React Hooks for Analytics
// ============================================

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { track, identify, resetAnalytics, initAnalytics, EVENTS } from './client';
import type { Dict } from 'mixpanel-browser';
import type { EventName } from './constants';

/**
 * Initialize analytics on mount
 */
export function useAnalyticsInit(): void {
    useEffect(() => {
        initAnalytics();
    }, []);
}

/**
 * Returns a stable track function
 */
export function useTrack() {
    return useCallback(<T extends Dict>(event: EventName, properties?: T) => {
        track(event, properties);
    }, []);
}

/**
 * Identify user when auth state changes
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
            resetAnalytics();
            identifiedRef.current = null;
        }
    }, [user]);
}

/**
 * Track page view with time on page
 */
export function usePageView(pageName: string): void {
    const mountTimeRef = useRef<number>(Date.now());

    useEffect(() => {
        mountTimeRef.current = Date.now();

        track(EVENTS.PAGE_VIEWED, {
            page_name: pageName,
        });

        // Track time on page when leaving
        return () => {
            const timeOnPage = Date.now() - mountTimeRef.current;
            // Note: This won't reliably fire on navigation, but captures unmount cases
            if (timeOnPage > 1000) {
                // Only track if > 1 second
                track(EVENTS.PAGE_VIEWED, {
                    page_name: pageName,
                    time_on_page_ms: timeOnPage,
                    is_exit: true,
                });
            }
        };
    }, [pageName]);
}

/**
 * Get entry point from sessionStorage or referrer
 */
export function getEntryPoint(): 'homepage' | 'navbar' | 'mybooks' | 'unknown' {
    if (typeof window === 'undefined') return 'unknown';

    // Check if we stored the entry point
    const stored = sessionStorage.getItem('create_entry_point');
    if (stored === 'homepage' || stored === 'navbar' || stored === 'mybooks') {
        return stored;
    }

    // Infer from referrer
    const referrer = document.referrer;
    if (referrer.includes('/mybooks')) return 'mybooks';
    if (referrer.endsWith('/') || referrer.includes('/?')) return 'homepage';

    return 'unknown';
}

/**
 * Set entry point for create flow (call before navigating to /create)
 */
export function setEntryPoint(entryPoint: 'homepage' | 'navbar' | 'mybooks'): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('create_entry_point', entryPoint);
}
