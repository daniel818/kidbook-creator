// ============================================
// Lulu Cost Calculation API
// ============================================
// Returns real-time retail pricing (never exposes wholesale costs)

import { NextRequest, NextResponse } from 'next/server';
import { calculateRetailPricing } from '@/lib/lulu/pricing';
import { calculateCostSchema, parseBody } from '@/lib/validations';
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
            console.log(`[Rate Limit] lulu/calculate-cost blocked for IP ${ip}`);
            return rateLimitResponse(rateResult);
        }

        const body = await request.json();

        // Validate request body with Zod
        const { data, error: validationError } = parseBody(calculateCostSchema, body);
        if (validationError) {
            return NextResponse.json(
                { error: validationError },
                { status: 400 }
            );
        }

        const pricing = await calculateRetailPricing({
            format: data.format,
            size: data.size,
            pageCount: data.pageCount,
            quantity: data.quantity,
            shippingOption: data.shippingOption,
            shipping: data.shipping,
            countryCode: data.countryCode,
            postalCode: data.postalCode,
            stateCode: data.stateCode,
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
        console.error('Cost calculation error:', error);
        const message = error instanceof Error ? error.message : 'Failed to calculate cost';
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
