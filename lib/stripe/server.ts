// ============================================
// Stripe Server Configuration
// ============================================

import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
});

export function formatPrice(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
}
