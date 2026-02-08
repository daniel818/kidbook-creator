// ============================================
// Server-side Analytics (for API routes/webhooks)
// ============================================

import Mixpanel from 'mixpanel';

// ============================================
// Event Constants (duplicated to avoid client import)
// ============================================

const EVENTS = {
    PAYMENT_COMPLETED: 'payment_completed',
    PAYMENT_FAILED: 'payment_failed',
    ORDER_PLACED: 'order_placed',
    BOOK_UNLOCKED: 'book_unlocked',
} as const;

// ============================================
// Types
// ============================================

export interface PaymentCompletedProps {
    book_id: string;
    payment_type: 'digital_unlock' | 'print_order';
    amount_usd: number;
    payment_method: string;
    stripe_payment_intent_id: string;
}

export interface PaymentFailedProps {
    book_id: string;
    payment_type: 'digital_unlock' | 'print_order';
    error_code?: string;
    error_message: string;
}

export interface OrderPlacedProps {
    book_id: string;
    order_id: string;
    format: string;
    size: string;
    quantity: number;
    total_usd: number;
    shipping_country: string;
}

export interface BookUnlockedProps {
    book_id: string;
    pages_generated: number;
}

// ============================================
// Client Setup
// ============================================

let mixpanelServer: Mixpanel.Mixpanel | null = null;

function getClient(): Mixpanel.Mixpanel | null {
    if (mixpanelServer) return mixpanelServer;

    const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
    if (!token) {
        console.warn('[Analytics Server] NEXT_PUBLIC_MIXPANEL_TOKEN not set');
        return null;
    }

    mixpanelServer = Mixpanel.init(token, { protocol: 'https' });
    return mixpanelServer;
}

function trackServer(event: string, distinctId: string, properties: object): void {
    const client = getClient();
    if (!client) {
        console.log('[Analytics Server] Event (not sent):', event, properties);
        return;
    }

    client.track(event, {
        distinct_id: distinctId,
        ...properties,
        $insert_id: `${event}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    });

    console.log('[Analytics Server] Tracked:', event);
}

function incrementProperty(distinctId: string, property: string, amount = 1): void {
    const client = getClient();
    if (!client) return;
    client.people.increment(distinctId, property, amount);
}

// ============================================
// Server Event Functions
// ============================================

export function trackPaymentCompleted(userId: string, props: PaymentCompletedProps): void {
    trackServer(EVENTS.PAYMENT_COMPLETED, userId, props);
    incrementProperty(userId, 'total_books_purchased', 1);
    incrementProperty(userId, 'total_spent_usd', props.amount_usd);
}

export function trackPaymentFailed(userId: string, props: PaymentFailedProps): void {
    trackServer(EVENTS.PAYMENT_FAILED, userId, props);
}

export function trackBookUnlocked(userId: string, props: BookUnlockedProps): void {
    trackServer(EVENTS.BOOK_UNLOCKED, userId, props);
}

export function trackOrderPlaced(userId: string, props: OrderPlacedProps): void {
    trackServer(EVENTS.ORDER_PLACED, userId, props);
}
