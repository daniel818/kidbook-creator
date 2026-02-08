// ============================================
// Get Order by Order ID
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api-guard';
import { checkRateLimit, rateLimitResponse, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';

interface RouteContext {
    params: Promise<{ orderId: string }>;
}

export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { orderId } = await context.params;
        const { user, supabase, error: authError } = await requireAuth();
        if (authError) return authError;
        if (!user || !supabase) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limit by IP
        const ip = getClientIp(request);
        const rateResult = checkRateLimit(`standard:ip:${ip}`, RATE_LIMITS.standard);
        if (!rateResult.allowed) {
            console.log(`[Rate Limit] orders/[orderId] GET blocked for IP ${ip}`);
            return rateLimitResponse(rateResult);
        }

        // Explicit ownership check + RLS for defense in depth
        const { data: order, error } = await supabase
            .from('orders')
            .select(`
                *,
                books (
                    title,
                    child_name,
                    thumbnail_url,
                    pages (
                        id,
                        page_type,
                        image_elements,
                        background_image
                    )
                )
            `)
            .eq('id', orderId)
            .eq('user_id', user.id)
            .single();

        if (error || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const getCoverThumbnail = (book: typeof order.books): string | null => {
            const coverPage = book?.pages?.find((p: { page_type: string }) => p.page_type === 'cover');
            const imageElements = Array.isArray(coverPage?.image_elements) ? coverPage.image_elements : [];
            return (imageElements as Array<{ src?: string }>)?.[0]?.src || coverPage?.background_image || book?.thumbnail_url || null;
        };

        return NextResponse.json({
            id: order.id,
            bookId: order.book_id,
            bookTitle: order.books?.title || 'Personalized Book',
            format: order.format.charAt(0).toUpperCase() + order.format.slice(1),
            size: order.size,
            quantity: order.quantity,
            total: `$${order.total.toFixed(2)}`,
            status: order.payment_status,
            fulfillmentStatus: order.fulfillment_status,
            estimatedDelivery: getEstimatedDelivery(),
            thumbnailUrl: getCoverThumbnail(order.books),
            childName: order.books?.child_name || null,
            pageCount: order.books?.pages?.length ?? null,
            shippingAddress: {
                name: order.shipping_full_name || null,
                line1: order.shipping_address_line1 || null,
                line2: order.shipping_address_line2 || null,
                city: order.shipping_city || null,
                state: order.shipping_state || null,
                postalCode: order.shipping_postal_code || null,
                country: order.shipping_country || null,
            },
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
    date.setDate(date.getDate() + 10);
    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}
