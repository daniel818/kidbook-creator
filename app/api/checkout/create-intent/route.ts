// ============================================
// Create PaymentIntent + Pending Order
// ============================================
// Replaces the Checkout Session flow with an embedded PaymentElement flow.
// Creates a PENDING order first, then a PaymentIntent, and returns the
// clientSecret so the frontend can render the Stripe PaymentElement inline.

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import { calculateRetailPricing } from '@/lib/lulu/pricing';
import { getPrintableInteriorPageCount } from '@/lib/lulu/page-count';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const adminDb = await createAdminClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { bookId, format, size, quantity, shipping, shippingLevel } = body;

        // Validate required fields (PDFs are NOT required at this stage — they come later via /attach-pdfs)
        if (!bookId || !format || !size || !quantity || !shipping || !shippingLevel) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Fetch book and verify ownership
        const { data: book, error: bookError } = await adminDb
            .from('books')
            .select('*, pages(*)')
            .eq('id', bookId)
            .eq('user_id', user.id)
            .single();

        if (bookError || !book) {
            return NextResponse.json({ error: 'Book not found or unauthorized' }, { status: 404 });
        }

        // Check preview/unlock status
        const isPreview = book.is_preview || book.status === 'preview';
        if (isPreview && !book.digital_unlock_paid) {
            return NextResponse.json({ error: 'Unlock required before ordering' }, { status: 402 });
        }

        // Validate quantity
        if (!Number.isInteger(quantity) || quantity < 1) {
            return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
        }

        // Calculate pricing (includes profit margin)
        const interiorPageCount = getPrintableInteriorPageCount(book, format, size);
        const pricing = await calculateRetailPricing({
            format,
            size,
            pageCount: interiorPageCount,
            quantity,
            shippingOption: shippingLevel,
            shipping,
        });

        // 1. Create PENDING order (without PDF paths — those come later via /attach-pdfs)
        const { data: order, error: orderError } = await adminDb
            .from('orders')
            .insert({
                book_id: bookId,
                user_id: user.id,
                format,
                size,
                quantity,
                subtotal: pricing.subtotal / 100,
                shipping_cost: pricing.shipping / 100,
                total: pricing.total / 100,
                shipping_full_name: shipping.fullName,
                shipping_address_line1: shipping.addressLine1,
                shipping_address_line2: shipping.addressLine2,
                shipping_city: shipping.city,
                shipping_state: shipping.state,
                shipping_postal_code: shipping.postalCode,
                shipping_country: shipping.country,
                shipping_phone: shipping.phone,
                shipping_level: shippingLevel,
                payment_status: 'pending',
            })
            .select()
            .single();

        if (orderError || !order) {
            console.error('Order creation error:', JSON.stringify(orderError, null, 2));
            return NextResponse.json({ error: 'Failed to initialize order.' }, { status: 500 });
        }

        // 2. Create PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: pricing.total,
            currency: 'usd',
            // Apple Pay and Google Pay are enabled automatically via PaymentElement
            // when the Stripe account has them configured. 'link' enables Stripe Link.
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                orderId: order.id,
                bookId: book.id,
                userId: user.id,
                flow: 'embedded_print',
            },
            receipt_email: user.email || undefined,
            description: `${book.title} - Personalized Children's Book (${format}, ${size}, ${interiorPageCount} pages)`,
        });

        // 3. Link PaymentIntent to order
        const { error: updateError } = await adminDb
            .from('orders')
            .update({ stripe_payment_intent_id: paymentIntent.id })
            .eq('id', order.id);

        if (updateError) {
            console.error('Failed to link payment intent to order:', updateError);
            // Cancel the orphaned PaymentIntent so the user isn't charged
            await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => {});
            return NextResponse.json(
                { error: 'Failed to finalize order setup. Please try again.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            orderId: order.id,
            paymentIntentId: paymentIntent.id,
            pricing: {
                subtotal: pricing.subtotal,
                shipping: pricing.shipping,
                total: pricing.total,
            },
        });

    } catch (error) {
        console.error('Create intent error:', error);
        return NextResponse.json(
            { error: 'Failed to create payment intent' },
            { status: 500 }
        );
    }
}
