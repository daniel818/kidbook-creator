// ============================================
// Stripe Client Configuration
// ============================================
// Note: process.env.NEXT_PUBLIC_* is used directly because Next.js
// inlines these at build time. Do not replace with env.* imports.

import { loadStripe, Stripe } from '@stripe/stripe-js';

const STRIPE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (!STRIPE_KEY) {
    throw new Error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
}

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
    if (!stripePromise) {
        stripePromise = loadStripe(STRIPE_KEY);
    }
    return stripePromise;
};
