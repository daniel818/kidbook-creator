// ============================================
// Stripe Webhook Handler (Consolidated)
// ============================================
// Handles: payment status updates, order fulfillment, email notifications

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/server';
import { fulfillOrder, FulfillmentStatus } from '@/lib/lulu/fulfillment';
import { createAdminClient } from '@/lib/supabase/server';
import { sendOrderConfirmation, sendDigitalUnlockEmail, OrderEmailData, DigitalUnlockEmailData } from '@/lib/email/client';
import { env } from '@/lib/env';

const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

/** Supabase order row shape used throughout webhook handlers */
interface OrderRow {
    id: string;
    book_id: string;
    format: string;
    size: string;
    quantity: number;
    total: number;
    payment_status: string;
    fulfillment_status: string;
    stripe_checkout_session_id?: string;
    stripe_payment_intent_id?: string;
    shipping_full_name?: string;
    shipping_address_line1?: string;
    shipping_address_line2?: string;
    shipping_city?: string;
    shipping_state?: string;
    shipping_postal_code?: string;
    shipping_country?: string;
    shipping_level?: string;
    pdf_url?: string;
    cover_url?: string;
}

/** Supabase book row shape used throughout webhook handlers */
interface BookRow {
    id: string;
    user_id: string;
    title?: string;
    child_name?: string;
    status?: string;
    digital_unlock_paid?: boolean;
    digital_unlock_email_sent?: boolean;
}

const logWebhook = (message: string, data?: unknown) => {
    const timestamp = new Date().toISOString();
    const logMsg = `[Webhook ${timestamp}] ${message}`;
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
        hasServiceKey: !!env.SUPABASE_SERVICE_ROLE_KEY,
        hasSupabaseUrl: !!env.NEXT_PUBLIC_SUPABASE_URL,
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
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                const piMetadata = paymentIntent.metadata;

                if (piMetadata?.flow === 'embedded_print') {
                    logWebhook('Handling embedded print payment', {
                        id: paymentIntent.id,
                        orderId: piMetadata?.orderId,
                    });
                    await handlePaymentIntentSucceeded(paymentIntent);
                } else if (piMetadata?.flow === 'embedded_digital') {
                    logWebhook('Handling embedded digital payment', {
                        id: paymentIntent.id,
                        bookId: piMetadata?.bookId,
                    });
                    await handleDigitalPaymentIntentSucceeded(paymentIntent);
                } else {
                    // Legacy Checkout Session flow — handled by checkout.session.completed
                    console.log('[Webhook] Payment succeeded (legacy):', paymentIntent.id);
                    logWebhook('payment_intent.succeeded (legacy)', { id: paymentIntent.id });
                }
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
    let order: OrderRow | null = null;

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
        order = data as OrderRow;
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

    order = updatedOrder as OrderRow;
    console.log(`[Webhook] Order ${orderId} marked as paid`);

    // Update book status to 'ordered'
    let book: BookRow | null = null;
    if (metadata?.bookId) {
        const { data: bookData } = await supabase
            .from('books')
            .update({ status: 'ordered', digital_unlock_paid: true })
            .eq('id', metadata.bookId)
            .select()
            .single();
        book = bookData as BookRow | null;
    } else if (order.book_id) {
        const { data: bookData } = await supabase
            .from('books')
            .update({ status: 'ordered', digital_unlock_paid: true })
            .eq('id', order.book_id)
            .select()
            .single();
        book = bookData as BookRow | null;
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
                    fullName: order.shipping_full_name ?? '',
                    addressLine1: order.shipping_address_line1 ?? '',
                    addressLine2: order.shipping_address_line2,
                    city: order.shipping_city ?? '',
                    state: order.shipping_state ?? '',
                    postalCode: order.shipping_postal_code ?? '',
                    country: order.shipping_country ?? '',
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
 * Handle successful payment via embedded PaymentElement (print orders)
 * Mirrors handleCheckoutComplete but works with PaymentIntent metadata.
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    console.log(`[Webhook] Processing payment intent: ${paymentIntent.id}`);

    const supabase = await createAdminClient();
    const metadata = paymentIntent.metadata;

    // Get order ID from metadata or find by payment intent ID
    let orderId = metadata?.orderId;
    let order: OrderRow | null = null;

    if (!orderId) {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('stripe_payment_intent_id', paymentIntent.id)
            .single();

        if (error || !data) {
            console.error('[Webhook] Could not find order for PI:', paymentIntent.id);
            return;
        }
        order = data as OrderRow;
        orderId = order.id;
    }

    // Update order payment status
    const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({
            payment_status: 'paid',
            stripe_payment_intent_id: paymentIntent.id,
        })
        .eq('id', orderId)
        .select()
        .single();

    if (updateError) {
        console.error('[Webhook] Failed to update order:', updateError);
        return;
    }

    order = updatedOrder as OrderRow;
    console.log(`[Webhook] Order ${orderId} marked as paid (embedded flow)`);

    // Update book status to 'ordered'
    const bookId = metadata?.bookId || order.book_id;
    let book: BookRow | null = null;
    if (bookId) {
        const { data: bookData } = await supabase
            .from('books')
            .update({ status: 'ordered', digital_unlock_paid: true })
            .eq('id', bookId)
            .select()
            .single();
        book = bookData as BookRow | null;
    }

    // Send order confirmation email
    const customerEmail = paymentIntent.receipt_email;
    if (customerEmail && order && book) {
        try {
            const emailData: OrderEmailData = {
                orderId: order.id,
                customerEmail,
                customerName: order.shipping_full_name || 'Customer',
                bookTitle: book.title || 'Personalized Book',
                childName: book.child_name || 'your child',
                format: order.format,
                size: order.size,
                quantity: order.quantity,
                total: order.total,
                shippingAddress: {
                    fullName: order.shipping_full_name ?? '',
                    addressLine1: order.shipping_address_line1 ?? '',
                    addressLine2: order.shipping_address_line2,
                    city: order.shipping_city ?? '',
                    state: order.shipping_state ?? '',
                    postalCode: order.shipping_postal_code ?? '',
                    country: order.shipping_country ?? '',
                },
            };

            const emailResult = await sendOrderConfirmation(emailData);
            if (emailResult.success) {
                console.log('[Webhook] Order confirmation email sent:', emailResult.id);
            } else {
                console.error('[Webhook] Failed to send order confirmation email');
            }
        } catch (emailError) {
            console.error('[Webhook] Email sending error:', emailError);
        }
    }

    // Trigger Lulu fulfillment
    if (!orderId) {
        console.error('[Webhook] Cannot trigger fulfillment: missing orderId');
        return;
    }
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

/**
 * Handle successful digital unlock via embedded PaymentElement
 * Mirrors handleDigitalUnlock but works with PaymentIntent metadata.
 */
async function handleDigitalPaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const supabase = await createAdminClient();
    const bookId = paymentIntent.metadata?.bookId;
    if (!bookId) {
        console.error('[Webhook] Digital unlock PI missing bookId');
        logWebhook('Digital unlock PI missing bookId');
        return;
    }

    // Idempotency check
    const { data: existingBook } = await supabase
        .from('books')
        .select('digital_unlock_paid, digital_unlock_session_id')
        .eq('id', bookId)
        .maybeSingle();

    if (
        existingBook?.digital_unlock_paid &&
        existingBook.digital_unlock_session_id === paymentIntent.id
    ) {
        logWebhook('Digital unlock already processed (PI)', { bookId, piId: paymentIntent.id });
        return;
    }

    const { data: book, error } = await supabase
        .from('books')
        .update({
            digital_unlock_paid: true,
            digital_unlock_session_id: paymentIntent.id,
        })
        .eq('id', bookId)
        .select('id, user_id, title, child_name')
        .single();

    if (error || !book) {
        console.error('[Webhook] Failed to mark digital unlock paid (PI)', error);
        logWebhook('Failed to mark digital unlock paid (PI)', { error, bookId, piId: paymentIntent.id });
        throw new Error(`Failed to mark digital unlock paid for book ${bookId}`);
    }

    logWebhook('Digital unlock marked paid (PI)', { bookId, piId: paymentIntent.id });

    // Get customer email
    let recipientEmail = paymentIntent.receipt_email || '';
    let recipientName = 'Customer';

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
