// ============================================
// User Orders API
// ============================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/orders - Get all orders for the current user
export async function GET() {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: orders, error } = await supabase
            .from('orders')
            .select(`
        *,
        books (
          id,
          title,
          child_name,
          book_type,
          book_theme
        )
      `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching orders:', error);
            return NextResponse.json(
                { error: 'Failed to fetch orders' },
                { status: 500 }
            );
        }

        // Define order type
        interface DbOrder {
            id: string;
            book_id: string;
            format: string;
            size: string;
            quantity: number;
            subtotal: number;
            shipping_cost: number;
            total: number;
            status: string;
            tracking_number: string | null;
            lulu_order_id: string | null;
            shipping_full_name: string;
            shipping_address_line1: string;
            shipping_address_line2: string | null;
            shipping_city: string;
            shipping_state: string;
            shipping_postal_code: string;
            shipping_country: string;
            created_at: string;
            updated_at: string;
            books: {
                id: string;
                title: string;
                child_name: string;
                book_type: string;
                book_theme: string;
            } | null;
        }

        // Transform orders for frontend
        const transformedOrders = (orders as DbOrder[]).map((order: DbOrder) => ({
            id: order.id,
            bookId: order.book_id,
            bookTitle: order.books?.title || 'Personalized Book',
            childName: order.books?.child_name,
            format: order.format,
            size: order.size,
            quantity: order.quantity,
            subtotal: order.subtotal,
            shipping: order.shipping_cost,
            total: order.total,
            status: order.status,
            trackingNumber: order.tracking_number,
            luluOrderId: order.lulu_order_id,
            shippingAddress: {
                fullName: order.shipping_full_name,
                addressLine1: order.shipping_address_line1,
                addressLine2: order.shipping_address_line2,
                city: order.shipping_city,
                state: order.shipping_state,
                postalCode: order.shipping_postal_code,
                country: order.shipping_country,
            },
            createdAt: order.created_at,
            updatedAt: order.updated_at,
        }));

        return NextResponse.json(transformedOrders);
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
