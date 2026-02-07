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
import { createRequestLogger, createModuleLogger } from '@/lib/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

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

const moduleLogger = createModuleLogger('stripe-webhook');

export async function POST(request: NextRequest) {
    const logger = createRequestLogger(request);
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');
    logger.info({
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    }, 'Webhook env');

    if (!signature) {
        logger.error('Missing stripe-signature header');
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
        logger.error({ err }, 'Signature verification failed');
        return NextResponse.json(
            { error: 'Webhook signature verification failed' },
            { status: 400 }
        );
    }

    logger.info({ type: event.type, id: event.id }, 'Received event');

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                if (session.metadata?.unlockType === 'digital') {
                    logger.info({ sessionId: session.id, bookId: session.metadata?.bookId }, 'Handling digital unlock');
                    await handleDigitalUnlock(session);
                } else {
                    logger.info({ sessionId: session.id, orderId: session.metadata?.orderId }, 'Handling print checkout');
                    await handleCheckoutComplete(session);
                }
                break;
            }

            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                const piMetadata = paymentIntent.metadata;

                if (piMetadata?.flow === 'embedded_print') {
                    logger.info({
                        id: paymentIntent.id,
                        orderId: piMetadata?.orderId,
                    }, 'Handling embedded print payment');
                    await handlePaymentIntentSucceeded(paymentIntent);
                } else if (piMetadata?.flow === 'embedded_digital') {
                    logger.info({
                        id: paymentIntent.id,
                        bookId: piMetadata?.bookId,
                    }, 'Handling embedded digital payment');
                    await handleDigitalPaymentIntentSucceeded(paymentIntent);
                } else {
                    // Legacy Checkout Session flow — handled by checkout.session.completed
                    logger.info({ id: paymentIntent.id }, 'Payment succeeded (legacy)');
                }
                break;
            }

            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                await handlePaymentFailed(paymentIntent);
                break;
            }

            default:
                logger.info({ eventType: event.type }, 'Unhandled event type');
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        logger.error({ err: error }, 'Handler error');
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
    const logger = moduleLogger.child({ handler: 'checkoutComplete', sessionId: session.id });
    logger.info('Processing checkout session');

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
            logger.error({ err: error }, 'Could not find order for session');
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
        logger.error({ err: updateError, orderId }, 'Failed to update order');
        return;
    }

    order = updatedOrder as OrderRow;
    logger.info({ orderId }, 'Order marked as paid');

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
                logger.info({ emailId: emailResult.id }, 'Order confirmation email sent');
            } else {
                logger.error('Failed to send order confirmation email');
            }
        } catch (emailError) {
            // Don't fail the webhook if email fails
            logger.error({ err: emailError }, 'Email sending error');
        }
    }

    // Trigger Lulu fulfillment
    logger.info({ orderId }, 'Triggering fulfillment for order');
    try {
        const result = await fulfillOrder(orderId);

        if (result.status === FulfillmentStatus.SUCCESS) {
            logger.info({ orderId }, 'Fulfillment successful');
        } else {
            logger.error({ orderId, error: result.error }, 'Fulfillment failed');
        }
    } catch (fulfillError) {
        logger.error({ err: fulfillError, orderId }, 'Fulfillment error');
    }
}

async function handleDigitalUnlock(session: Stripe.Checkout.Session): Promise<void> {
    const supabase = await createAdminClient();
    const bookId = session.metadata?.bookId;
    const logger = moduleLogger.child({ handler: 'digitalUnlock', sessionId: session.id, bookId });
    if (!bookId) {
        logger.error('Digital unlock missing bookId');
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
        logger.info('Digital unlock already processed');
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
        logger.error({ err: error }, 'Failed to mark digital unlock paid');
        // Return 500 so Stripe retries the webhook (idempotency guard above prevents duplicates).
        throw new Error(`Failed to mark digital unlock paid for book ${bookId}`);
    }

    logger.info('Digital unlock marked paid');

    const customerEmail = session.customer_email || session.customer_details?.email;
    let recipientEmail = customerEmail || '';
    let recipientName = session.customer_details?.name || 'Customer';

    if (!recipientEmail) {
        const { data: userResult, error: userError } = await supabase.auth.admin.getUserById(book.user_id);
        if (userError) {
            logger.error({ err: userError }, 'Failed to load user email');
        } else {
            recipientEmail = userResult?.user?.email || '';
            recipientName = userResult?.user?.user_metadata?.full_name || recipientName;
        }
    }

    if (!recipientEmail) {
        logger.error('Missing recipient email for digital unlock');
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
                logger.warn({ err: emailSentError, bookId: book.id }, 'Failed to mark digital unlock email sent (non-fatal)');
            }
        }
    } catch (emailError) {
        logger.error({ err: emailError }, 'Digital unlock email error');
    }
}

/**
 * Handle successful payment via embedded PaymentElement (print orders)
 * Mirrors handleCheckoutComplete but works with PaymentIntent metadata.
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const logger = moduleLogger.child({ handler: 'paymentIntentSucceeded', paymentIntentId: paymentIntent.id });
    logger.info('Processing payment intent');

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
            logger.error({ err: error }, 'Could not find order for payment intent');
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
        logger.error({ err: updateError, orderId }, 'Failed to update order');
        return;
    }

    order = updatedOrder as OrderRow;
    logger.info({ orderId }, 'Order marked as paid (embedded flow)');

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
                logger.info({ emailId: emailResult.id }, 'Order confirmation email sent');
            } else {
                logger.error('Failed to send order confirmation email');
            }
        } catch (emailError) {
            logger.error({ err: emailError }, 'Email sending error');
        }
    }

    // Trigger Lulu fulfillment
    if (!orderId) {
        logger.error('Cannot trigger fulfillment: missing orderId');
        return;
    }
    logger.info({ orderId }, 'Triggering fulfillment for order');
    try {
        const result = await fulfillOrder(orderId);

        if (result.status === FulfillmentStatus.SUCCESS) {
            logger.info({ orderId }, 'Fulfillment successful');
        } else {
            logger.error({ orderId, error: result.error }, 'Fulfillment failed');
        }
    } catch (fulfillError) {
        logger.error({ err: fulfillError, orderId }, 'Fulfillment error');
    }
}

/**
 * Handle successful digital unlock via embedded PaymentElement
 * Mirrors handleDigitalUnlock but works with PaymentIntent metadata.
 */
async function handleDigitalPaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const supabase = await createAdminClient();
    const bookId = paymentIntent.metadata?.bookId;
    const logger = moduleLogger.child({ handler: 'digitalPaymentIntentSucceeded', paymentIntentId: paymentIntent.id, bookId });
    if (!bookId) {
        logger.error('Digital unlock PI missing bookId');
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
        logger.info('Digital unlock already processed (PI)');
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
        logger.error({ err: error }, 'Failed to mark digital unlock paid (PI)');
        throw new Error(`Failed to mark digital unlock paid for book ${bookId}`);
    }

    logger.info('Digital unlock marked paid (PI)');

    // Get customer email
    let recipientEmail = paymentIntent.receipt_email || '';
    let recipientName = 'Customer';

    if (!recipientEmail) {
        const { data: userResult, error: userError } = await supabase.auth.admin.getUserById(book.user_id);
        if (userError) {
            logger.error({ err: userError }, 'Failed to load user email');
        } else {
            recipientEmail = userResult?.user?.email || '';
            recipientName = userResult?.user?.user_metadata?.full_name || recipientName;
        }
    }

    if (!recipientEmail) {
        logger.error('Missing recipient email for digital unlock');
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
                logger.warn({ err: emailSentError, bookId: book.id }, 'Failed to mark digital unlock email sent (non-fatal)');
            }
        }
    } catch (emailError) {
        logger.error({ err: emailError }, 'Digital unlock email error');
    }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const logger = moduleLogger.child({ handler: 'paymentFailed', paymentIntentId: paymentIntent.id });
    logger.info('Payment failed');

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
        logger.error({ err: error }, 'Failed to update order after payment failure');
    }
}
