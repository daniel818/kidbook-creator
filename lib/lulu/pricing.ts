import { createLuluClient, CostCalculationOptions } from '@/lib/lulu/client';
import { getLuluProductId } from '@/lib/lulu/fulfillment';

export interface RetailPricingInput {
    format: 'softcover' | 'hardcover';
    size: '7.5x7.5' | '8x8' | '8x10';
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

const MARKUP_MULTIPLIER = 3; // 200% margin => wholesale * 3
const MIN_SUBTOTAL_PER_BOOK = 4000; // $40.00 in cents
const ROUND_TO = 100; // round up to nearest $1

function applyPricingRules(wholesale: number, quantity: number) {
    const markedUp = wholesale * MARKUP_MULTIPLIER;
    const rounded = Math.ceil(markedUp / ROUND_TO) * ROUND_TO;
    const minSubtotal = MIN_SUBTOTAL_PER_BOOK * Math.max(1, quantity);
    return Math.max(rounded, minSubtotal);
}

export async function calculateRetailPricing(input: RetailPricingInput): Promise<RetailPricingResult> {
    const hasLuluCredentials = process.env.LULU_API_KEY && process.env.LULU_API_SECRET;

    if (!hasLuluCredentials) {
        throw new Error('Lulu credentials not configured');
    }

    const shouldCalculateShipping = Boolean(input.shippingOption && input.shipping);
    const luluClient = createLuluClient();
    const baseOptions: CostCalculationOptions = {
        format: input.format,
        size: input.size,
        pageCount: input.pageCount,
        quantity: input.quantity,
        podPackageId: getLuluProductId(input.format, input.size, input.pageCount),
    };

    let wholesale: number;
    let shipping = 0;

    if (shouldCalculateShipping) {
        const options: CostCalculationOptions = {
            ...baseOptions,
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
    } else {
        const options: CostCalculationOptions = {
            ...baseOptions,
            name: 'Pricing Estimate',
            street1: '123 Main St',
            shippingCity: 'New York',
            countryCode: 'US',
            postalCode: '10001',
            stateCode: 'NY',
            phoneNumber: '0000000000',
        };
        const result = await luluClient.calculateCost(options);
        wholesale = result.productCost;
    }

    const subtotal = applyPricingRules(wholesale, input.quantity);
    const total = subtotal + shipping;
    const isEstimate = false;

    return {
        wholesale,
        subtotal,
        shipping,
        total,
        margin: MARKUP_MULTIPLIER,
        isEstimate,
    };
}
