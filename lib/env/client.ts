// ============================================
// Client Environment Variable Validation
// ============================================
// Validates NEXT_PUBLIC_* vars without Zod (avoids client bundle bloat).
// These vars are inlined by Next.js at build time, so we validate
// that they were set during the build.

export function validateClientEnv() {
    const required: Record<string, string | undefined> = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    };

    const missing = Object.entries(required)
        .filter(([, value]) => !value)
        .map(([key]) => key);

    if (missing.length > 0) {
        throw new Error(
            `Missing required client environment variables:\n${missing.join('\n')}\n` +
            `These must be set at build time.`
        );
    }
}
