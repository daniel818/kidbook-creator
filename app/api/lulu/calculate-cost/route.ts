// ============================================
// Lulu Cost Calculation API
// ============================================
// Returns real-time pricing from Lulu's API

import { NextRequest, NextResponse } from 'next/server';
import { createLuluClient, CostCalculationOptions } from '@/lib/lulu/client';

// Profit margin multiplier (e.g., 1.3 = 30% markup)
const PROFIT_MARGIN = 1.3;

// Fallback prices in cents (used when Lulu API fails)
const FALLBACK_PRICES = {
    softcover: {
        '6x6': { basePrice: 899, perPage: 35 },
        '8x8': { basePrice: 1299, perPage: 45 },
        '8x10': { basePrice: 1499, perPage: 55 }
    },
    hardcover: {
        '6x6': { basePrice: 1899, perPage: 45 },
        '8x8': { basePrice: 2499, perPage: 55 },
        '8x10': { basePrice: 2999, perPage: 65 }
    }
};

const FALLBACK_SHIPPING = 499; // $4.99

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { format, size, pageCount, quantity, countryCode, postalCode, stateCode } = body;

        // Validate required fields
        if (!format || !size || !pageCount || !quantity) {
            return NextResponse.json(
                { error: 'Missing required fields: format, size, pageCount, quantity' },
                { status: 400 }
            );
        }

        // Check if Lulu credentials are configured
        const hasLuluCredentials = process.env.LULU_API_KEY && process.env.LULU_API_SECRET;

        let wholesale: number;
        let shipping: number;
        let isEstimate = false;

        if (hasLuluCredentials) {
            try {
                const luluClient = createLuluClient();

                const options: CostCalculationOptions = {
                    format,
                    size,
                    pageCount,
                    quantity,
                    countryCode: countryCode || 'US',
                    postalCode: postalCode || '10001',
                    stateCode: stateCode || 'NY',
                };

                const result = await luluClient.calculateCost(options);
                wholesale = result.productCost;
                shipping = result.shippingCost;
            } catch (luluError) {
                console.error('Lulu API error, using fallback prices:', luluError);
                // Fall back to hardcoded prices
                const fallback = FALLBACK_PRICES[format as keyof typeof FALLBACK_PRICES]?.[size as keyof (typeof FALLBACK_PRICES)['softcover']];
                if (!fallback) {
                    return NextResponse.json({ error: 'Invalid format/size' }, { status: 400 });
                }
                wholesale = (fallback.basePrice + (fallback.perPage * pageCount)) * quantity;
                shipping = FALLBACK_SHIPPING;
                isEstimate = true;
            }
        } else {
            // No Lulu credentials, use fallback
            const fallback = FALLBACK_PRICES[format as keyof typeof FALLBACK_PRICES]?.[size as keyof (typeof FALLBACK_PRICES)['softcover']];
            if (!fallback) {
                return NextResponse.json({ error: 'Invalid format/size' }, { status: 400 });
            }
            wholesale = (fallback.basePrice + (fallback.perPage * pageCount)) * quantity;
            shipping = FALLBACK_SHIPPING;
            isEstimate = true;
        }

        // Apply profit margin to product cost (not shipping)
        const subtotal = Math.round(wholesale * PROFIT_MARGIN);
        const total = subtotal + shipping;

        return NextResponse.json({
            wholesale,           // Lulu's price (cents)
            subtotal,            // Your price after markup (cents)
            shipping,            // Shipping cost (cents)
            total,               // Final total (cents)
            margin: PROFIT_MARGIN,
            isEstimate,          // True if using fallback prices
            formatted: {
                wholesale: `$${(wholesale / 100).toFixed(2)}`,
                subtotal: `$${(subtotal / 100).toFixed(2)}`,
                shipping: `$${(shipping / 100).toFixed(2)}`,
                total: `$${(total / 100).toFixed(2)}`,
            }
        });

    } catch (error) {
        console.error('Cost calculation error:', error);
        return NextResponse.json(
            { error: 'Failed to calculate cost' },
            { status: 500 }
        );
    }
}
