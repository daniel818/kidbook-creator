// ============================================
// Stripe PaymentIntent for Digital Unlock
// ============================================
// Creates a PaymentIntent (instead of a Checkout Session) so the frontend
// can render an embedded PaymentElement for the $15 digital unlock fee.

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

        // Create PaymentIntent instead of Checkout Session
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 1500, // $15.00
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                unlockType: 'digital',
                flow: 'embedded_digital',
                bookId: book.id,
                userId: user.id,
            },
            receipt_email: user.email || undefined,
            description: `${book.title} - Digital Unlock`,
        });

        // Store the PaymentIntent ID for idempotency checks in the webhook
        await adminDb
            .from('books')
            .update({ digital_unlock_session_id: paymentIntent.id })
            .eq('id', book.id);

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        });
    } catch (error) {
        console.error('Digital checkout error:', error);
        return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 });
    }
}
