// ============================================
// Server Environment Variable Validation
// ============================================
// Validates all server-side env vars at startup using Zod.
// Import { env } from '@/lib/env' in server code to access typed env vars.

import { z } from 'zod';

const serverEnvSchema = z.object({
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

    // Stripe
    STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_').optional(),
    STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),

    // Gemini
    GEMINI_API_KEY: z.string().min(1),
    GEMINI_TEXT_MODEL: z.string().default('gemini-3-flash-preview'),
    GEMINI_IMAGE_MODEL: z.string().default('gemini-3-pro-image-preview'),
    GEMINI_REF_IMAGE_MODEL: z.string().default('gemini-3-pro-image-preview'),

    // Lulu
    LULU_API_KEY: z.string().min(1),
    LULU_API_SECRET: z.string().min(1),
    LULU_SANDBOX: z.enum(['true', 'false']).default('true'),
    LULU_WEBHOOK_SECRET: z.string().optional(),

    // Resend
    RESEND_API_KEY: z.string().min(1),
    EMAIL_FROM: z.string().default('KidBook Creator <orders@kidbookcreator.com>'),

    // App
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_BOOK_PRICE_MARKUP: z.string().optional(),

    // Internal API
    INTERNAL_API_KEY: z.string().optional(),
    INTERNAL_API_BASE_URL: z.string().url().optional(),

    // Storage
    SUPABASE_STORAGE_ORIGIN: z.string().default('http://127.0.0.1:54321'),
    STORAGE_TUNNEL_URL: z.string().url().optional(),
    TUNNEL_URL: z.string().url().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let _env: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
    if (_env) return _env;

    const parsed = serverEnvSchema.safeParse(process.env);
    if (!parsed.success) {
        const formatted = parsed.error.issues
            .map((i) => `  ${i.path.join('.')}: ${i.message}`)
            .join('\n');
        throw new Error(
            `Missing or invalid environment variables:\n${formatted}\n` +
            `See .env.example for required variables.`
        );
    }

    _env = parsed.data;
    return _env;
}

// Proxy-based export for convenient `env.VAR` access.
// Validation triggers lazily on first property access.
export const env = new Proxy({} as ServerEnv, {
    get(_target, prop: string) {
        return getServerEnv()[prop as keyof ServerEnv];
    },
});
