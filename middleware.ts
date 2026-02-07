// ============================================
// Supabase Middleware
// ============================================
// Handles session refresh on every request

import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const locales = ['en', 'de', 'he'];
const defaultLocale = 'en';

// Routes that should use locale prefixes
const localeRoutes = ['/pricing', '/faq', '/about', '/terms', '/privacy'];

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    const getLocaleFromHeader = (headerValue: string | null) => {
        if (!headerValue) return null;
        const parts = headerValue.split(',').map((part) => part.trim());
        for (const part of parts) {
            const langTag = part.split(';')[0];
            const baseLang = langTag.split('-')[0].toLowerCase();
            if (locales.includes(baseLang)) {
                return baseLang;
            }
        }
        return null;
    };
    
    // Check if the pathname already has a locale
    const pathnameHasLocale = locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    // Only redirect to locale path if it's a locale-aware route and doesn't have a locale
    if (!pathnameHasLocale) {
        const shouldUseLocale = localeRoutes.some(route => pathname.startsWith(route));
        
        if (shouldUseLocale) {
            // Try to get locale from cookie or browser, validate against allowed locales
            const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
            const headerLocale = getLocaleFromHeader(request.headers.get('accept-language'));
            const resolvedLocale = (cookieLocale && locales.includes(cookieLocale))
                ? cookieLocale
                : (headerLocale || defaultLocale);

            // Redirect to the same path with locale prefix, preserving query string
            const redirectUrl = request.nextUrl.clone();
            redirectUrl.pathname = `/${resolvedLocale}${pathname}`;
            const response = NextResponse.redirect(redirectUrl);
            response.cookies.set('NEXT_LOCALE', resolvedLocale, {
                path: '/',
                maxAge: 60 * 60 * 24 * 365,
            });
            return response;
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
