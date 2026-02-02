// ============================================
// Stripe Checkout for Digital Unlock
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const adminDb = await createAdminClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { bookId } = body;

        if (!bookId) {
            return NextResponse.json({ error: 'Missing bookId' }, { status: 400 });
        }

        const { data: book, error: bookError } = await adminDb
            .from('books')
            .select('id, title, user_id, status, is_preview, digital_unlock_paid, thumbnail_url')
            .eq('id', bookId)
            .eq('user_id', user.id)
            .single();

        if (bookError || !book) {
            return NextResponse.json({ error: 'Book not found or unauthorized' }, { status: 404 });
        }

        const isPreview = book.is_preview || book.status === 'preview';
        if (!isPreview) {
            return NextResponse.json({ error: 'Book is already unlocked' }, { status: 400 });
        }

        if (book.digital_unlock_paid) {
            return NextResponse.json({ error: 'Already paid' }, { status: 409 });
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            customer_email: user.email || undefined,
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `${book.title} - Digital Unlock`,
                            description: 'Full story, all illustrations, high-res PDF',
                            images: book.thumbnail_url ? [book.thumbnail_url] : [],
                        },
                        unit_amount: 1500,
                    },
                    quantity: 1,
                }
            ],
            metadata: {
                unlockType: 'digital',
                bookId: book.id,
                userId: user.id,
            },
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/unlock/success?session_id={CHECKOUT_SESSION_ID}&bookId=${book.id}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/book/${book.id}`,
        });

        await adminDb
            .from('books')
            .update({ digital_unlock_session_id: session.id })
            .eq('id', book.id);

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Digital checkout error:', error);
        return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }
}
