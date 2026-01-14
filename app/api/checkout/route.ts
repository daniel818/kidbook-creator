// ============================================
// Stripe Checkout API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, calculatePrice, formatPrice, BookPricing } from '@/lib/stripe/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { bookId, format, size, quantity, shipping } = body;

        // Validate required fields
        if (!bookId || !format || !size || !quantity || !shipping) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get book details
        const { data: book, error: bookError } = await supabase
            .from('books')
            .select('*, pages(*)')
            .eq('id', bookId)
            .eq('user_id', user.id)
            .single();

        if (bookError || !book) {
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }

        // Calculate pricing
        const pricingOptions: BookPricing = {
            format,
            size,
            pageCount: book.pages.length,
            quantity
        };

        const pricing = calculatePrice(pricingOptions);

        // Create Stripe checkout session
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
                        unit_amount: Math.round(pricing.subtotal / quantity), // Must be integer (cents)
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
                        unit_amount: Math.round(pricing.shipping), // Must be integer (cents)
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                bookId: book.id,
                userId: user.id,
                format,
                size,
                quantity: quantity.toString(),
                shippingName: shipping.fullName,
                shippingAddress1: shipping.addressLine1,
                shippingAddress2: shipping.addressLine2 || '',
                shippingCity: shipping.city,
                shippingState: shipping.state,
                shippingPostalCode: shipping.postalCode,
                shippingCountry: shipping.country,
                shippingPhone: shipping.phone,
            },
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/create/${bookId}/order`,
        });

        // Create order record in database
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                book_id: bookId,
                user_id: user.id,
                format,
                size,
                quantity,
                subtotal: pricing.subtotal / 100,  // Store as dollars
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
                stripe_checkout_session_id: session.id,
                status: 'pending',
            })
            .select()
            .single();

        if (orderError) {
            console.error('Order creation error:', orderError);
            // Continue anyway - we can reconcile from webhook
        }

        return NextResponse.json({
            sessionId: session.id,
            url: session.url,
            orderId: order?.id,
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
