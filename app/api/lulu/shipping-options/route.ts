// ============================================
// Lulu Shipping Options API
// ============================================
// Returns available shipping levels for a given address + line item

import { NextRequest, NextResponse } from 'next/server';
import { createLuluClient } from '@/lib/lulu/client';
import { getLuluProductId } from '@/lib/lulu/fulfillment';
import { env } from '@/lib/env';

export async function POST(request: NextRequest) {
    try {
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

        if (!env.LULU_API_KEY || !env.LULU_API_SECRET) {
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
