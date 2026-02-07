// ============================================
// Lulu Shipping Options API
// ============================================
// Returns available shipping levels for a given address + line item

import { NextRequest, NextResponse } from 'next/server';
import { createLuluClient } from '@/lib/lulu/client';
import { getLuluProductId } from '@/lib/lulu/fulfillment';
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
            loggerRL.info({ ip }, 'Rate limited: lulu/shipping-options');
            return rateLimitResponse(rateResult);
        }

        const body = await request.json();
        const {
            format,
            size,
            pageCount,
            quantity,
            shipping,
            currency,
        } = body;

        if (!format || !size || !pageCount || !quantity || !shipping) {
            return NextResponse.json(
                { error: 'Missing required fields: format, size, pageCount, quantity, shipping' },
                { status: 400 }
            );
        }

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
        const logger = createRequestLogger(request);
        logger.error({ err: error }, 'Shipping options error');
        return NextResponse.json(
            { error: 'Failed to retrieve shipping options' },
            { status: 500 }
        );
    }
}
