// ============================================
// Get Order by Session ID
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createRequestLogger } from '@/lib/logger';
import { requireAuth } from '@/lib/auth/api-guard';
import { checkRateLimit, rateLimitResponse, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';

interface RouteContext {
    params: Promise<{ sessionId: string }>;
}

export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { sessionId } = await context.params;
        const { user, supabase, error: authError } = await requireAuth();
        if (authError) return authError;
        if (!user || !supabase) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limit by IP
        const ip = getClientIp(request);
        const rateResult = checkRateLimit(`standard:ip:${ip}`, RATE_LIMITS.standard);
        if (!rateResult.allowed) {
            const loggerRL = createRequestLogger(request);
            loggerRL.info({ ip }, 'Rate limited: orders/session/[sessionId] GET');
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
          pages (id)
        )
      `)
            .eq('stripe_checkout_session_id', sessionId)
            .eq('user_id', user.id)
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
            status: order.payment_status,
            fulfillmentStatus: order.fulfillment_status,
            estimatedDelivery: getEstimatedDelivery(),
            thumbnailUrl: order.books?.thumbnail_url || null,
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
        const logger = createRequestLogger(request);
        logger.error({ err: error }, 'Error fetching order by session');
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
