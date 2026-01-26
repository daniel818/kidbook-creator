import { createLuluClient, CostCalculationOptions } from '@/lib/lulu/client';
import { getLuluProductId } from '@/lib/lulu/fulfillment';

// Profit margin multiplier (e.g., 1.3 = 30% markup)
const PROFIT_MARGIN = 1.3;

// Fallback prices in cents (used when Lulu API fails)
const FALLBACK_PRICES = {
    softcover: {
        '6x6': { basePrice: 899, perPage: 35 },
        '8x8': { basePrice: 1299, perPage: 45 },
        '8x10': { basePrice: 1499, perPage: 55 },
    },
    hardcover: {
        '6x6': { basePrice: 1899, perPage: 45 },
        '8x8': { basePrice: 2499, perPage: 55 },
        '8x10': { basePrice: 2999, perPage: 65 },
    },
};

const FALLBACK_SHIPPING = 499; // $4.99

export interface RetailPricingInput {
    format: 'softcover' | 'hardcover';
    size: '6x6' | '8x8' | '8x10';
    pageCount: number;
    quantity: number;
    shippingOption?: CostCalculationOptions['shippingOption'];
    shipping?: {
        fullName?: string;
        addressLine1?: string;
        addressLine2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
        phone?: string;
    };
    countryCode?: string;
    postalCode?: string;
    stateCode?: string;
}

export interface RetailPricingResult {
    wholesale: number;
    subtotal: number;
    shipping: number;
    total: number;
    margin: number;
    isEstimate: boolean;
}

export async function calculateRetailPricing(input: RetailPricingInput): Promise<RetailPricingResult> {
    const hasLuluCredentials = process.env.LULU_API_KEY && process.env.LULU_API_SECRET;

    let wholesale: number;
    let shipping: number;
    let isEstimate = false;

    if (hasLuluCredentials) {
        try {
            const luluClient = createLuluClient();
            const options: CostCalculationOptions = {
                format: input.format,
                size: input.size,
                pageCount: input.pageCount,
                quantity: input.quantity,
                podPackageId: getLuluProductId(input.format, input.size, input.pageCount),
                name: input.shipping?.fullName,
                street1: input.shipping?.addressLine1,
                street2: input.shipping?.addressLine2,
                phoneNumber: input.shipping?.phone,
                shippingCity: input.shipping?.city,
                countryCode: input.countryCode || input.shipping?.country || 'US',
                postalCode: input.postalCode || input.shipping?.postalCode || '10001',
                stateCode: input.stateCode || input.shipping?.state || 'NY',
                shippingOption: input.shippingOption,
            };

            const result = await luluClient.calculateCost(options);
            wholesale = result.productCost;
            shipping = result.shippingCost;
        } catch (error) {
            console.error('Lulu API error, using fallback prices:', error);
            isEstimate = true;
        }
    } else {
        isEstimate = true;
    }

    if (isEstimate) {
        const fallback = FALLBACK_PRICES[input.format]?.[input.size];
        if (!fallback) {
            throw new Error('Invalid format/size');
        }
        wholesale = (fallback.basePrice + (fallback.perPage * input.pageCount)) * input.quantity;
        shipping = FALLBACK_SHIPPING;
    }

    const subtotal = Math.round(wholesale * PROFIT_MARGIN);
    const total = subtotal + shipping;

    return {
        wholesale,
        subtotal,
        shipping,
        total,
        margin: PROFIT_MARGIN,
        isEstimate,
    };
}
