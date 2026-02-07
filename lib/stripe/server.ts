// ============================================
// Stripe Server Configuration
// ============================================

import Stripe from 'stripe';

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
    if (!_stripe) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) {
            throw new Error('Missing STRIPE_SECRET_KEY environment variable');
        }
        _stripe = new Stripe(key, {
            apiVersion: '2025-02-24.acacia',
            typescript: true,
            maxNetworkRetries: 2,
        });
    }
    return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
    get(_, prop) {
        const instance = getStripe();
        const value = (instance as unknown as Record<string | symbol, unknown>)[prop];
        // Bind functions to the real instance to preserve `this` context
        if (typeof value === 'function') {
            return value.bind(instance);
        }
        return value;
    },
});

export function formatPrice(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
}
