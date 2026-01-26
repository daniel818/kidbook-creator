// ============================================
// Supabase Middleware Client
// ============================================
// Use this in middleware.ts for session refresh

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    await supabase.auth.getUser();

    // Add Content Security Policy
    // Allowing 'data:' in font-src is CRITICAL for jsPDF/html2canvas to embed fonts
    const csp = `
        default-src 'self';
        script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        font-src 'self' data: https://fonts.gstatic.com https://js.stripe.com;
        img-src 'self' blob: data: https://*.supabase.co https://*.stripe.com https://via.placeholder.com http://127.0.0.1:54321 https://www.gstatic.com https://warm-zebras-vanish.loca.lt;
        connect-src 'self' https://*.supabase.co https://api.stripe.com https://maps.googleapis.com http://127.0.0.1:54321 https://warm-zebras-vanish.loca.lt;
        frame-src 'self' https://js.stripe.com https://hooks.stripe.com;
        object-src 'none';
        base-uri 'self';
    `.replace(/\s{2,}/g, ' ').trim();

    supabaseResponse.headers.set('Content-Security-Policy', csp);

    // Force no-cache to ensure CSP is updated immediately
    supabaseResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    supabaseResponse.headers.set('Pragma', 'no-cache');
    supabaseResponse.headers.set('Expires', '0');

    // Debug Log (Check server console to see if this runs!)
    console.log('[Middleware] Applied CSP Headers');

    return supabaseResponse;
}
