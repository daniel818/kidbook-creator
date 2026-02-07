// ============================================
// Supabase Browser Client
// ============================================
// Use this client in Client Components
// Note: process.env.NEXT_PUBLIC_* is used directly because Next.js
// inlines these at build time. Do not replace with env.* imports.

import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export function createClient() {
    return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
