// ============================================
// Supabase Middleware Client
// ============================================
// Use this in middleware.ts for session refresh

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { createModuleLogger } from '@/lib/logger';

const logger = createModuleLogger('middleware');

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
    // NOTE: 'unsafe-eval' in script-src is required by jsPDF/html2canvas for PDF generation
    // NOTE: 'unsafe-inline' in script-src is required for Next.js inline scripts
    // Allowing 'data:' in font-src is CRITICAL for jsPDF/html2canvas to embed fonts
    const csp = `
        default-src 'self';
        script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        font-src 'self' data: https://fonts.gstatic.com https://js.stripe.com;
        img-src 'self' blob: data: https://*.supabase.co https://*.stripe.com http://127.0.0.1:54321 https://www.gstatic.com https://warm-zebras-vanish.loca.lt;
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

    // --- Security Headers ---

    // Prevent MIME type sniffing
    supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking — DENY is safe here because X-Frame-Options only controls
    // whether THIS page can be framed by others, NOT whether iframes we embed (like Stripe)
    // can load. Stripe's js.stripe.com serves its own headers on its iframe responses.
    supabaseResponse.headers.set('X-Frame-Options', 'DENY');

    // Control referrer information sent with requests
    supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Restrict browser feature access
    supabaseResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');

    // Legacy XSS protection for older browsers
    supabaseResponse.headers.set('X-XSS-Protection', '1; mode=block');

    // Enable DNS prefetching for linked domains
    supabaseResponse.headers.set('X-DNS-Prefetch-Control', 'on');

    // Force HTTPS in production (1 year with includeSubDomains)
    // Note: The 'preload' directive alone does NOT auto-submit to the HSTS preload list —
    // that requires manual submission at hstspreload.org. We include it here so the site
    // is ready for preload submission if/when desired.
    if (process.env.NODE_ENV === 'production') {
        supabaseResponse.headers.set(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains; preload'
        );
    }

    logger.debug('Applied CSP and security headers');

    return supabaseResponse;
}
