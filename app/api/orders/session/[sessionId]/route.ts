// ============================================
// Get Order by Session ID
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteContext {
    params: Promise<{ sessionId: string }>;
}

export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { sessionId } = await context.params;
        const supabase = await createClient();

        // Get order by Stripe session ID
        const { data: order, error } = await supabase
            .from('orders')
            .select(`
        *,
        books (
          title,
          child_name
        )
      `)
            .eq('stripe_checkout_session_id', sessionId)
            .single();

        if (error || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Format response
        return NextResponse.json({
            id: order.id,
            bookId: order.book_id,
            bookTitle: order.books?.title || 'Personalized Book',
            format: order.format.charAt(0).toUpperCase() + order.format.slice(1),
            size: order.size,
            quantity: order.quantity,
            total: `$${order.total.toFixed(2)}`,
            status: order.status,
            fulfillmentStatus: order.fulfillment_status,
            estimatedDelivery: getEstimatedDelivery(),
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

function getEstimatedDelivery(): string {
    const date = new Date();
    date.setDate(date.getDate() + 10); // 10 business days
    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}
