// ============================================
// Lulu Shipping Options API
// ============================================
// Returns available shipping levels for a given address + line item

import { NextRequest, NextResponse } from 'next/server';
import { createLuluClient } from '@/lib/lulu/client';
import { getLuluProductId } from '@/lib/lulu/fulfillment';
import { requireAuth } from '@/lib/auth/api-guard';
import { checkRateLimit, rateLimitResponse, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import { shippingOptionsSchema, parseBody } from '@/lib/validations';

export async function POST(request: NextRequest) {
    try {
        const { error: authError } = await requireAuth();
        if (authError) return authError;

        // Rate limit by IP
        const ip = getClientIp(request);
        const rateResult = checkRateLimit(`standard:ip:${ip}`, RATE_LIMITS.standard);
        if (!rateResult.allowed) {
            console.log(`[Rate Limit] lulu/shipping-options blocked for IP ${ip}`);
            return rateLimitResponse(rateResult);
        }

        const body = await request.json();

        // Validate request body with Zod
        const result = parseBody(shippingOptionsSchema, body);
        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        const { format, size, pageCount, quantity, shipping, currency } = result.data;

        if (!process.env.LULU_API_KEY || !process.env.LULU_API_SECRET) {
            return NextResponse.json({ error: 'Lulu credentials not configured' }, { status: 500 });
        }

        const podPackageId = getLuluProductId(format, size, pageCount);
        const luluClient = createLuluClient();
        const options = await luluClient.getShippingOptions({
            currency: currency || 'USD',
            lineItems: [{
                pageCount,
                podPackageId,
                quantity,
            }],
            shippingAddress: {
                name: shipping.fullName,
                street1: shipping.addressLine1,
                street2: shipping.addressLine2,
                city: shipping.city,
                stateCode: shipping.state,
                postalCode: shipping.postalCode,
                countryCode: shipping.country,
                phoneNumber: shipping.phone,
            },
        });

        return NextResponse.json({ options });
    } catch (error) {
        console.error('Shipping options error:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve shipping options' },
            { status: 500 }
        );
    }
}
