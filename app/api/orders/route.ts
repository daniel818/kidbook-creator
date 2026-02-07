// ============================================
// User Orders API
// ============================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

// GET /api/orders - Get all orders for the current user
export async function GET() {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limit standard API calls
        const rateResult = checkRateLimit(`standard:${user.id}`, RATE_LIMITS.standard);
        if (!rateResult.allowed) {
            console.log(`[Rate Limit] orders GET blocked for user ${user.id}`);
            return rateLimitResponse(rateResult);
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
                    book_theme,
                    thumbnail_url,
                    pages (
                        page_type,
                        image_elements,
                        background_image
                    )
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
            payment_status: string;             // Renamed from status
            fulfillment_status: string;
            tracking_number: string | null;
            tracking_url: string | null;        // Direct tracking URL from Lulu
            carrier_name: string | null;        // Carrier name (UPS, FedEx, etc.)
            lulu_order_id: string | null;
            lulu_status: string | null;
            lulu_print_job_id: string | null;
            estimated_delivery_min: string | null;  // Earliest delivery date
            estimated_delivery_max: string | null;  // Latest delivery date
            shipped_at: string | null;          // When order was shipped
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
                thumbnail_url: string | null;
                pages?: Array<{
                    page_type: string;
                    image_elements: Array<{ src?: string }> | null;
                    background_image: string | null;
                }>;
            } | null;
        }

        const getCoverThumbnail = (book: DbOrder['books']): string | null => {
            const coverPage = book?.pages?.find((page) => page.page_type === 'cover');
            const imageElements = Array.isArray(coverPage?.image_elements) ? coverPage?.image_elements : [];
            return imageElements?.[0]?.src || coverPage?.background_image || book?.thumbnail_url || null;
        };

        // Transform orders for frontend
        const transformedOrders = (orders as DbOrder[]).map((order: DbOrder) => ({
            id: order.id,
            bookId: order.book_id,
            bookTitle: order.books?.title || 'Personalized Book',
            bookThumbnail: getCoverThumbnail(order.books),
            childName: order.books?.child_name,
            format: order.format,
            size: order.size,
            quantity: order.quantity,
            subtotal: order.subtotal,
            shipping: order.shipping_cost,
            total: order.total,
            status: order.payment_status,      // Now uses payment_status column
            trackingNumber: order.tracking_number,
            trackingUrl: order.tracking_url,         // Direct tracking URL from Lulu
            carrierName: order.carrier_name,         // Carrier name (UPS, FedEx, etc.)
            luluOrderId: order.lulu_order_id,
            luluStatus: order.lulu_status,
            fulfillmentStatus: order.fulfillment_status,
            printJobId: order.lulu_print_job_id,
            estimatedDeliveryMin: order.estimated_delivery_min,
            estimatedDeliveryMax: order.estimated_delivery_max,
            shippedAt: order.shipped_at,
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
