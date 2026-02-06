// ============================================
// Lulu Cost Calculation API
// ============================================
// Returns real-time pricing from Lulu's API

import { NextRequest, NextResponse } from 'next/server';
import { calculateRetailPricing } from '@/lib/lulu/pricing';
import { calculateCostSchema, parseBody } from '@/lib/validations';

export async function POST(request: NextRequest) {
    try {
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
            wholesale: pricing.wholesale,           // Lulu's price (cents)
            subtotal: pricing.subtotal,            // Your price after markup (cents)
            shipping: pricing.shipping,            // Shipping cost (cents)
            total: pricing.total,                  // Final total (cents)
            margin: pricing.margin,
            isEstimate: pricing.isEstimate,          // True if using fallback prices
            formatted: {
                wholesale: `$${(pricing.wholesale / 100).toFixed(2)}`,
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
            { status: 502 }
        );
    }
}
