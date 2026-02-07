// ============================================
// API Authentication Guards
// ============================================
// Reusable auth helpers for API routes

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Require authenticated user. Returns user and supabase client on success,
 * or a 401 NextResponse on failure.
 */
export async function requireAuth() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return {
            user: null,
            supabase: null,
            error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        };
    }

    return { user, supabase, error: null };
}

/**
 * Require admin user. Returns user and supabase client on success,
 * or a 401/403 NextResponse on failure.
 */
export async function requireAdmin() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return {
            user: null,
            supabase: null,
            error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        };
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (profileError) {
        console.error('[requireAdmin] Failed to fetch profile:', profileError.message);
        return {
            user: null,
            supabase: null,
            error: NextResponse.json({ error: 'Failed to verify admin status' }, { status: 500 }),
        };
    }

    if (!profile?.is_admin) {
        return {
            user: null,
            supabase: null,
            error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
        };
    }

    return { user, supabase, error: null };
}
