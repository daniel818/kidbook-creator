// ============================================
// Supabase Browser Client
// ============================================
// Use this client in Client Components

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Fail fast in browser if env vars are missing
    if (typeof window !== 'undefined' && (!url || !key)) {
        throw new Error(
            'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
            'Ensure these environment variables are set for the runtime environment.'
        );
    }

    // During SSR/build (window === undefined), env vars may be absent.
    // Use non-routable placeholder so no accidental network requests can be made.
    // The SSR-created client is never used for real requests — AuthProvider
    // hydrates in the browser via useEffect with the real client.
    return createBrowserClient(
        url || 'https://placeholder.invalid',
        key || 'placeholder-key-for-build'
    );
}
