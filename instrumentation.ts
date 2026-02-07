// ============================================
// Next.js Instrumentation Hook
// ============================================
// Initializes Sentry on the server side and validates environment variables.
// See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Validate environment variables at startup
        const { getServerEnv } = await import('@/lib/env/server');
        try {
            getServerEnv();
            console.log('[instrumentation] Environment variables validated successfully');
        } catch (error) {
            console.error('[instrumentation] FATAL: Environment validation failed');
            console.error(error);
            process.exit(1);
        }

        await import('./sentry.server.config');
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
        await import('./sentry.edge.config');
    }
}

export const onRequestError = async (
    err: { digest: string } & Error,
    request: {
        path: string;
        method: string;
        headers: { [key: string]: string };
    },
    context: {
        routerKind: string;
        routePath: string;
        routeType: string;
        renderSource: string;
        revalidateReason: string | undefined;
        renderType: string;
    }
) => {
    // Dynamic import to avoid issues if Sentry is not configured
    try {
        const Sentry = await import('@sentry/nextjs');
        Sentry.captureRequestError(err, request, context);
    } catch {
        // Sentry not available, just log
        console.error('[Instrumentation] Request error:', err?.message, request?.path);
    }
};
