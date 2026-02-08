// ============================================
// Stripe Server Configuration
// ============================================

import Stripe from 'stripe';
import { env } from '@/lib/env';

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
    if (!_stripe) {
        _stripe = new Stripe(env.STRIPE_SECRET_KEY, {
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
