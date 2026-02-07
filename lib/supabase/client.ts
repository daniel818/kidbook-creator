// ============================================
// Supabase Browser Client
// ============================================
// Use this client in Client Components

import { createBrowserClient } from '@supabase/ssr';

// Build-time fallbacks allow static page generation to succeed without env vars.
// At runtime (in the browser), we fail fast if env vars are truly missing.
const SUPABASE_URL_FALLBACK = 'http://localhost:54321';
const SUPABASE_KEY_FALLBACK = 'placeholder-key-for-build';

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL_FALLBACK;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_KEY_FALLBACK;

    if (typeof window !== 'undefined' && (url === SUPABASE_URL_FALLBACK || key === SUPABASE_KEY_FALLBACK)) {
        throw new Error(
            'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
            'Ensure these environment variables are set for the runtime environment.'
        );
    }

    return createBrowserClient(url, key);
}
