// ============================================
// Stripe Server Configuration
// ============================================

import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
    maxNetworkRetries: 2,
});

// Price calculation for books
export interface BookPricing {
    format: 'softcover' | 'hardcover';
    size: '7.5x7.5' | '8x8' | '8x10';
    pageCount: number;
    quantity: number;
}

export interface PriceBreakdown {
    basePrice: number;
    pagePrice: number;
    subtotal: number;
    shipping: number;
    total: number;
}

const PRICING = {
    softcover: {
        '7.5x7.5': { basePrice: 899, perPage: 35 },    // cents
        '8x8': { basePrice: 1299, perPage: 45 },
        '8x10': { basePrice: 1499, perPage: 55 }
    },
    hardcover: {
        '7.5x7.5': { basePrice: 1899, perPage: 45 },
        '8x8': { basePrice: 2499, perPage: 55 },
        '8x10': { basePrice: 2999, perPage: 65 }
    }
};

const SHIPPING_COST = 499; // $4.99 in cents

export function calculatePrice(options: BookPricing): PriceBreakdown {
    const pricing = PRICING[options.format][options.size];
    const basePrice = pricing.basePrice;
    const pagePrice = options.pageCount * pricing.perPage;
    const subtotal = (basePrice + pagePrice) * options.quantity;
    const shipping = SHIPPING_COST;
    const total = subtotal + shipping;

    return {
        basePrice,
        pagePrice,
        subtotal,
        shipping,
        total
    };
}

export function formatPrice(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
}
