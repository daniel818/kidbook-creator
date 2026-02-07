// ============================================
// Supabase Browser Client
// ============================================
// Use this client in Client Components

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Fail fast at runtime if env vars are missing
    if (typeof window !== 'undefined' && (!url || !key)) {
        throw new Error(
            'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
            'Ensure these environment variables are set for the runtime environment.'
        );
    }

    // Build-time fallbacks allow static page generation to succeed without env vars
    return createBrowserClient(
        url || 'http://localhost:54321',
        key || 'placeholder-key-for-build'
    );
}
