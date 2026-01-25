// ============================================
// Stripe Checkout API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { stripe, calculatePrice, formatPrice, BookPricing } from '@/lib/stripe/server';

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
        const { bookId, format, size, quantity, shipping, pdfUrl, coverUrl } = body;

        console.log('[Checkout API] Received request:', {
            bookId,
            hasPdf: !!pdfUrl,
            hasCover: !!coverUrl,
            pdfUrlLength: pdfUrl?.length
        });

        // Validate required fields
        if (!bookId || !format || !size || !quantity || !shipping) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate PDF paths (CRITICAL: Do not allow payment without files)
        if (!pdfUrl || typeof pdfUrl !== 'string') {
            return NextResponse.json({ error: 'Missing Interior PDF. Please try again.' }, { status: 400 });
        }
        if (!coverUrl || typeof coverUrl !== 'string') {
            return NextResponse.json({ error: 'Missing Cover PDF. Please try again.' }, { status: 400 });
        }

        const { data: book, error: bookError } = await adminDb
            .from('books')
            .select('*, pages(*)')
            .eq('id', bookId)
            // SECURITY: Enforce ownership. Even with admin client, we logically verify the user owns the book.
            .eq('user_id', user.id)
            .single();

        if (bookError || !book) {
            return NextResponse.json({ error: 'Book not found or unauthorized' }, { status: 404 });
        }

        // Validate quantity
        if (!Number.isInteger(quantity) || quantity < 1) {
            return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
        }

        // Calculate pricing
        const pricingOptions: BookPricing = {
            format,
            size,
            pageCount: book.pages.length,
            quantity
        };

        const pricing = calculatePrice(pricingOptions);

        // 1. Create PENDING Order Record FIRST (Prevent Dangling Payment Risk)
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
                status: 'pending', // No session ID yet
                // CRITICAL: Save the generated file paths!
                pdf_url: pdfUrl,
                cover_pdf_url: coverUrl,
            })
            .select()
            .single();

        if (orderError || !order) {
            console.error('Order creation error:', JSON.stringify(orderError, null, 2));
            return NextResponse.json({ error: 'Failed to initialize order.' }, { status: 500 });
        }

        // 2. Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            customer_email: user.email,
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `${book.title} - Personalized Children's Book`,
                            description: `${format.charAt(0).toUpperCase() + format.slice(1)}, ${size}, ${book.pages.length} pages`,
                            images: book.thumbnail_url ? [book.thumbnail_url] : [],
                        },
                        unit_amount: Math.round(pricing.subtotal / quantity),
                    },
                    quantity: quantity,
                },
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Shipping & Handling',
                            description: 'Standard shipping (5-10 business days)',
                        },
                        unit_amount: Math.round(pricing.shipping),
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                orderId: order.id, // Link specifically to THIS order
                bookId: book.id,
                userId: user.id,
            },
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/create/${bookId}/order`,
        });

        // 3. Update Order with Session ID
        const { error: updateError } = await adminDb
            .from('orders')
            .update({ stripe_checkout_session_id: session.id })
            .eq('id', order.id);

        if (updateError) {
            console.error('Failed to link session to order:', updateError);
            // We don't fail the request because the user can still pay, 
            // and the webhook needs to handle lookup by orderId from metadata anyway.
        }

        return NextResponse.json({
            sessionId: session.id,
            url: session.url,
            orderId: order.id,
            pricing: {
                subtotal: formatPrice(pricing.subtotal),
                shipping: formatPrice(pricing.shipping),
                total: formatPrice(pricing.total),
            }
        });

    } catch (error) {
        console.error('Checkout error:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
