// ============================================
// Supabase Middleware
// ============================================
// Handles session refresh on every request

import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const locales = ['en', 'de', 'he'];
const defaultLocale = 'en';

// Routes that should use locale prefixes
const localeRoutes = ['/pricing'];

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    
    // Check if the pathname already has a locale
    const pathnameHasLocale = locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    // Only redirect to locale path if it's a locale-aware route and doesn't have a locale
    if (!pathnameHasLocale) {
        const shouldUseLocale = localeRoutes.some(route => pathname.startsWith(route));
        
        if (shouldUseLocale) {
            // Try to get locale from cookie or browser
            const locale = request.cookies.get('NEXT_LOCALE')?.value || defaultLocale;
            
            // Redirect to the same path with locale prefix
            return NextResponse.redirect(
                new URL(`/${locale}${pathname}`, request.url)
            );
        }
    }

    return await updateSession(request);
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
