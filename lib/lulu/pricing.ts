import { createLuluClient, CostCalculationOptions } from '@/lib/lulu/client';
import { getLuluProductId } from '@/lib/lulu/fulfillment';
import { PROFIT_MARGIN } from '@/lib/pricing/book-price';

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

    const subtotal = Math.round(wholesale * PROFIT_MARGIN);
    const total = subtotal + shipping;
    const isEstimate = false;

    return {
        wholesale,
        subtotal,
        shipping,
        total,
        margin: PROFIT_MARGIN,
        isEstimate,
    };
}
