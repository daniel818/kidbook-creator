// ============================================
// Lulu Cost Calculation API
// ============================================
// Returns real-time retail pricing (never exposes wholesale costs)

import { NextRequest, NextResponse } from 'next/server';
import { calculateRetailPricing } from '@/lib/lulu/pricing';
import { createRequestLogger } from '@/lib/logger';
import { requireAuth } from '@/lib/auth/api-guard';
import { checkRateLimit, rateLimitResponse, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
    try {
        const { error: authError } = await requireAuth();
        if (authError) return authError;

        // Rate limit by IP
        const ip = getClientIp(request);
        const rateResult = checkRateLimit(`standard:ip:${ip}`, RATE_LIMITS.standard);
        if (!rateResult.allowed) {
            const loggerRL = createRequestLogger(request);
            loggerRL.info({ ip }, 'Rate limited: lulu/calculate-cost');
            return rateLimitResponse(rateResult);
        }

        const body = await request.json();
        const { format, size, pageCount, quantity, countryCode, postalCode, stateCode, shippingOption, shipping: shippingAddress } = body;

        // Validate required fields
        if (!format || !size || !pageCount || !quantity) {
            return NextResponse.json(
                { error: 'Missing required fields: format, size, pageCount, quantity' },
                { status: 400 }
            );
        }

        const pricing = await calculateRetailPricing({
            format,
            size,
            pageCount,
            quantity,
            shippingOption,
            shipping: shippingAddress,
            countryCode,
            postalCode,
            stateCode,
        });

        return NextResponse.json({
            subtotal: pricing.subtotal,
            shipping: pricing.shipping,
            total: pricing.total,
            isEstimate: pricing.isEstimate,
            formatted: {
                subtotal: `$${(pricing.subtotal / 100).toFixed(2)}`,
                shipping: `$${(pricing.shipping / 100).toFixed(2)}`,
                total: `$${(pricing.total / 100).toFixed(2)}`,
            }
        });

    } catch (error) {
        const logger = createRequestLogger(request);
        logger.error({ err: error }, 'Cost calculation error');
        const message = error instanceof Error ? error.message : 'Failed to calculate cost';
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
