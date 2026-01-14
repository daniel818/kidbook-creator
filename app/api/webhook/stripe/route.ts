// ============================================
// Stripe Webhook Handler
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { createClient } from '@supabase/supabase-js';
import { sendOrderConfirmation, OrderEmailData } from '@/lib/email/client';
import Stripe from 'stripe';

// Create admin client for webhook (no user context)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutComplete(session);
                break;
            }

            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                console.log('Payment succeeded:', paymentIntent.id);
                break;
            }

            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                await handlePaymentFailed(paymentIntent);
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook handler error:', error);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const { metadata } = session;

    if (!metadata?.bookId || !metadata?.userId) {
        console.error('Missing metadata in checkout session');
        return;
    }

    // Update order status to 'paid'
    const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .update({
            status: 'paid',
            stripe_payment_intent_id: session.payment_intent as string,
        })
        .eq('stripe_checkout_session_id', session.id)
        .select()
        .single();

    if (orderError) {
        console.error('Failed to update order:', orderError);
        return;
    }

    // Update book status to 'ordered'
    const { data: book } = await supabaseAdmin
        .from('books')
        .update({ status: 'ordered' })
        .eq('id', metadata.bookId)
        .select()
        .single();

    console.log(`Order completed for book ${metadata.bookId}`);

    // Send order confirmation email
    if (session.customer_email && order && book) {
        const emailData: OrderEmailData = {
            orderId: order.id,
            customerEmail: session.customer_email,
            customerName: metadata.shippingName || 'Customer',
            bookTitle: book.title || 'Personalized Book',
            childName: book.child_name || 'your child',
            format: order.format,
            size: order.size,
            quantity: order.quantity,
            total: order.total,
            shippingAddress: {
                fullName: order.shipping_full_name,
                addressLine1: order.shipping_address_line1,
                addressLine2: order.shipping_address_line2,
                city: order.shipping_city,
                state: order.shipping_state,
                postalCode: order.shipping_postal_code,
                country: order.shipping_country,
            },
        };

        const emailResult = await sendOrderConfirmation(emailData);
        if (emailResult.success) {
            console.log('Order confirmation email sent:', emailResult.id);
        } else {
            console.error('Failed to send order confirmation email');
        }
    }

    // TODO: Trigger PDF generation and Lulu API submission
    // This would typically be done via a background job
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    // Find and update the order
    const { error } = await supabaseAdmin
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('stripe_payment_intent_id', paymentIntent.id);

    if (error) {
        console.error('Failed to update cancelled order:', error);
    }
}
