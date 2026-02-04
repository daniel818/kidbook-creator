// ============================================
// Stripe Webhook Handler (Consolidated)
// ============================================
// Handles: payment status updates, order fulfillment, email notifications

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { fulfillOrder, FulfillmentStatus } from '@/lib/lulu/fulfillment';
import { createAdminClient } from '@/lib/supabase/server';
import { sendOrderConfirmation, sendDigitalUnlockEmail, OrderEmailData, DigitalUnlockEmailData } from '@/lib/email/client';
import * as fs from 'fs';
import * as path from 'path';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const logWebhook = (message: string, data?: unknown) => {
    const timestamp = new Date().toISOString();
    const logMsg = `[Webhook ${timestamp}] ${message}`;
    try {
        const logPath = path.join(process.cwd(), 'api_debug.log');
        fs.appendFileSync(logPath, `${logMsg} ${data ? JSON.stringify(data) : ''}\n`);
    } catch {
        // ignore
    }
    if (data !== undefined) {
        console.log(logMsg, data);
    } else {
        console.log(logMsg);
    }
};

export async function POST(request: NextRequest) {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');
    logWebhook('Webhook env', {
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    });

    if (!signature) {
        console.error('[Webhook] Missing stripe-signature header');
        logWebhook('Missing stripe-signature header');
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
        console.error('[Webhook] Signature verification failed:', err);
        logWebhook('Signature verification failed');
        return NextResponse.json(
            { error: 'Webhook signature verification failed' },
            { status: 400 }
        );
    }

    console.log(`[Webhook] Received event: ${event.type}`);
    logWebhook('Received event', { type: event.type, id: event.id });

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                if (session.metadata?.unlockType === 'digital') {
                    logWebhook('Handling digital unlock', { sessionId: session.id, bookId: session.metadata?.bookId });
                    await handleDigitalUnlock(session);
                } else {
                    logWebhook('Handling print checkout', { sessionId: session.id, orderId: session.metadata?.orderId });
                    await handleCheckoutComplete(session);
                }
                break;
            }

            case 'payment_intent.succeeded': {
                // Backup handler in case checkout.session.completed is missed
                console.log('[Webhook] Payment succeeded:', event.data.object.id);
                logWebhook('payment_intent.succeeded', { id: event.data.object.id });
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
    } catch (error) {
        console.error('[Webhook] Handler error:', error);
        logWebhook('Handler error');
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}

/**
 * Handle successful checkout completion
 * 1. Update order payment status
 * 2. Update book status
 * 3. Send confirmation email
 * 4. Trigger Lulu fulfillment
 */
async function handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
    console.log(`[Webhook] Processing checkout session: ${session.id}`);

    const supabase = await createAdminClient();
    const metadata = session.metadata;

    // Get order ID from metadata or find by session ID
    let orderId = metadata?.orderId;
    let order: any = null;

    if (!orderId) {
        // Try to find order by Stripe session ID
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('stripe_checkout_session_id', session.id)
            .single();

        if (error || !data) {
            console.error('[Webhook] Could not find order for session:', session.id);
            return;
        }
        order = data;
        orderId = order.id;
    }

    // Update order payment status
    const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({
            payment_status: 'paid',
            stripe_payment_intent_id: session.payment_intent,
        })
        .eq('id', orderId)
        .select()
        .single();

    if (updateError) {
        console.error('[Webhook] Failed to update order:', updateError);
        return;
    }

    order = updatedOrder;
    console.log(`[Webhook] Order ${orderId} marked as paid`);

    // Update book status to 'ordered'
    let book: any = null;
    if (metadata?.bookId) {
        const { data: bookData } = await supabase
            .from('books')
            .update({ status: 'ordered', digital_unlock_paid: true })
            .eq('id', metadata.bookId)
            .select()
            .single();
        book = bookData;
    } else if (order.book_id) {
        const { data: bookData } = await supabase
            .from('books')
            .update({ status: 'ordered', digital_unlock_paid: true })
            .eq('id', order.book_id)
            .select()
            .single();
        book = bookData;
    }

    // Send order confirmation email
    if (session.customer_email && order && book) {
        try {
            const emailData: OrderEmailData = {
                orderId: order.id,
                customerEmail: session.customer_email,
                customerName: metadata?.shippingName || order.shipping_full_name || 'Customer',
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
                console.log('[Webhook] Order confirmation email sent:', emailResult.id);
            } else {
                console.error('[Webhook] Failed to send order confirmation email');
            }
        } catch (emailError) {
            // Don't fail the webhook if email fails
            console.error('[Webhook] Email sending error:', emailError);
        }
    }

    // Trigger Lulu fulfillment
    console.log(`[Webhook] Triggering fulfillment for order: ${orderId}`);
    try {
        const result = await fulfillOrder(orderId);

        if (result.status === FulfillmentStatus.SUCCESS) {
            console.log(`[Webhook] Fulfillment successful for order ${orderId}`);
        } else {
            console.error(`[Webhook] Fulfillment failed for order ${orderId}:`, result.error);
        }
    } catch (fulfillError) {
        console.error(`[Webhook] Fulfillment error for order ${orderId}:`, fulfillError);
    }
}

async function handleDigitalUnlock(session: Stripe.Checkout.Session): Promise<void> {
    const supabase = await createAdminClient();
    const bookId = session.metadata?.bookId;
    if (!bookId) {
        console.error('[Webhook] Digital unlock missing bookId');
        logWebhook('Digital unlock missing bookId');
        return;
    }

    // Idempotency: if we've already processed this exact session for this book, don't do it again.
    // This also protects against duplicate emails when Stripe retries the webhook.
    const { data: existingBook } = await supabase
        .from('books')
        .select('digital_unlock_paid, digital_unlock_session_id')
        .eq('id', bookId)
        .maybeSingle();

    if (
        existingBook?.digital_unlock_paid &&
        existingBook.digital_unlock_session_id === session.id
    ) {
        logWebhook('Digital unlock already processed', { bookId, sessionId: session.id });
        return;
    }

    const { data: book, error } = await supabase
        .from('books')
        .update({
            digital_unlock_paid: true,
            digital_unlock_session_id: session.id,
        })
        .eq('id', bookId)
        // NOTE: Do not select optional columns that may not exist in all environments.
        // Selecting a missing column will cause the UPDATE to fail, preventing unlock.
        .select('id, user_id, title, child_name')
        .single();

    if (error || !book) {
        console.error('[Webhook] Failed to mark digital unlock paid', error);
        logWebhook('Failed to mark digital unlock paid', { error, bookId, sessionId: session.id });
        // Return 500 so Stripe retries the webhook (idempotency guard above prevents duplicates).
        throw new Error(`Failed to mark digital unlock paid for book ${bookId}`);
    }

    logWebhook('Digital unlock marked paid', { bookId, sessionId: session.id });

    const customerEmail = session.customer_email || session.customer_details?.email;
    let recipientEmail = customerEmail || '';
    let recipientName = session.customer_details?.name || 'Customer';

    if (!recipientEmail) {
        const { data: userResult, error: userError } = await supabase.auth.admin.getUserById(book.user_id);
        if (userError) {
            console.error('[Webhook] Failed to load user email', userError);
        } else {
            recipientEmail = userResult?.user?.email || '';
            recipientName = userResult?.user?.user_metadata?.full_name || recipientName;
        }
    }

    if (!recipientEmail) {
        console.error('[Webhook] Missing recipient email for digital unlock');
        return;
    }

    try {
        const emailData: DigitalUnlockEmailData = {
            bookId: book.id,
            customerEmail: recipientEmail,
            customerName: recipientName,
            bookTitle: book.title || 'Personalized Book',
            childName: book.child_name || 'your child',
        };
        const emailResult = await sendDigitalUnlockEmail(emailData);
        if (emailResult.success) {
            // Best-effort: some environments may not have this column yet.
            const { error: emailSentError } = await supabase
                .from('books')
                .update({ digital_unlock_email_sent: true })
                .eq('id', book.id);
            if (emailSentError) {
                logWebhook('Failed to mark digital unlock email sent (non-fatal)', { error: emailSentError, bookId: book.id });
            }
        }
    } catch (emailError) {
        console.error('[Webhook] Digital unlock email error:', emailError);
    }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    console.log(`[Webhook] Payment failed: ${paymentIntent.id}`);

    const supabase = await createAdminClient();

    // Find and update order
    const { error } = await supabase
        .from('orders')
        .update({
            payment_status: 'payment_failed',
            payment_error: paymentIntent.last_payment_error?.message,
        })
        .eq('stripe_payment_intent_id', paymentIntent.id);

    if (error) {
        console.error('[Webhook] Failed to update order after payment failure:', error);
    }
}
