export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { getServerEnv } = await import('@/lib/env/server');
        try {
            getServerEnv();
            console.log('[instrumentation] Environment variables validated successfully');
        } catch (error) {
            console.error('[instrumentation] FATAL: Environment validation failed');
            console.error(error);
            process.exit(1);
        }
    }
}
