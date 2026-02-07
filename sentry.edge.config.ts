// ============================================
// Sentry Edge Runtime Configuration
// ============================================
// Initializes Sentry for edge runtime (middleware, edge API routes).
// This file is automatically loaded by @sentry/nextjs.

import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Environment
    environment: process.env.NODE_ENV,

    // Only enable when DSN is configured
    enabled: !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
});
