// ============================================
// Sentry Client-Side Configuration
// ============================================
// Initializes Sentry error tracking in the browser.
// This file is automatically loaded by @sentry/nextjs.

import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session Replay (sample 1% in production)
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 1.0,

    // Environment
    environment: process.env.NODE_ENV,

    // Only enable in production or when DSN is set
    enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Filter out noisy errors
    ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        // Network errors
        'Failed to fetch',
        'NetworkError',
        'Load failed',
        // User-initiated navigation
        'AbortError',
        'ResizeObserver loop',
    ],

    integrations: [
        Sentry.replayIntegration(),
    ],
});
