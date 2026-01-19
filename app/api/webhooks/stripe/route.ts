// ============================================
// Stripe Webhook Handler
// ============================================
// Listens for successful payments and triggers fulfillment

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { fulfillOrder, FulfillmentStatus } from '@/lib/lulu/fulfillment';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
        console.error('[Webhook] Missing stripe-signature header');
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
        console.error('[Webhook] Signature verification failed:', err);
        return NextResponse.json(
            { error: 'Webhook signature verification failed' },
            { status: 400 }
        );
    }

    console.log(`[Webhook] Received event: ${event.type}`);

    // Handle specific events
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            await handleCheckoutComplete(session);
            break;
        }

        case 'payment_intent.succeeded': {
            // Backup handler in case checkout.session.completed is missed
            console.log('[Webhook] Payment succeeded:', event.data.object.id);
            break;
        }

        case 'payment_intent.payment_failed': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            await handlePaymentFailed(paymentIntent);
            break;
        }

        default:
            console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
}

/**
 * Handle successful checkout completion
 */
async function handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
    console.log(`[Webhook] Processing checkout session: ${session.id}`);

    const supabase = await createClient();

    // Get order ID from session metadata
    const orderId = session.metadata?.orderId;
    const bookId = session.metadata?.bookId;

    if (!orderId) {
        // Try to find order by Stripe session ID
        const { data: order, error } = await supabase
            .from('orders')
            .select('id')
            .eq('stripe_checkout_session_id', session.id)
            .single();

        if (error || !order) {
            console.error('[Webhook] Could not find order for session:', session.id);
            return;
        }

        // Update order status to paid
        await supabase
            .from('orders')
            .update({
                status: 'paid',
                stripe_payment_intent_id: session.payment_intent,
            })
            .eq('id', order.id);

        // Trigger fulfillment
        console.log(`[Webhook] Triggering fulfillment for order: ${order.id}`);
        const result = await fulfillOrder(order.id);

        if (result.status === FulfillmentStatus.SUCCESS) {
            console.log(`[Webhook] Fulfillment successful for order ${order.id}`);
        } else {
            console.error(`[Webhook] Fulfillment failed for order ${order.id}:`, result.error);
        }
    } else {
        // Update order status to paid
        await supabase
            .from('orders')
            .update({
                status: 'paid',
                stripe_payment_intent_id: session.payment_intent,
            })
            .eq('id', orderId);

        // Trigger fulfillment
        console.log(`[Webhook] Triggering fulfillment for order: ${orderId}`);
        const result = await fulfillOrder(orderId);

        if (result.status === FulfillmentStatus.SUCCESS) {
            console.log(`[Webhook] Fulfillment successful for order ${orderId}`);
        } else {
            console.error(`[Webhook] Fulfillment failed for order ${orderId}:`, result.error);
        }
    }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    console.log(`[Webhook] Payment failed: ${paymentIntent.id}`);

    const supabase = await createClient();

    // Find and update order
    const { error } = await supabase
        .from('orders')
        .update({
            status: 'payment_failed',
            payment_error: paymentIntent.last_payment_error?.message,
        })
        .eq('stripe_payment_intent_id', paymentIntent.id);

    if (error) {
        console.error('[Webhook] Failed to update order after payment failure:', error);
    }
}
