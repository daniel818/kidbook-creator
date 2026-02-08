// ============================================
// Admin Single Order API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendShippingNotification, sendDeliveryConfirmation, OrderEmailData, ShippingEmailData } from '@/lib/email/client';
import { createRequestLogger } from '@/lib/logger';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

interface RouteContext {
    params: Promise<{ orderId: string }>;
}

// GET /api/admin/orders/[orderId]
export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { orderId } = await context.params;
        const supabase = await createClient();

        // Check admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (!profile?.is_admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Rate limit admin API calls
        const rateResult = checkRateLimit(`standard:${user.id}`, RATE_LIMITS.standard);
        if (!rateResult.allowed) {
            const loggerGet = createRequestLogger(request);
            loggerGet.info({ userId: user.id }, 'Rate limited: admin/orders/[orderId] GET');
            return rateLimitResponse(rateResult);
        }

        const { data: order, error } = await supabase
            .from('orders')
            .select(`
        *,
        books (*),
        profiles:user_id (email, full_name)
      `)
            .eq('id', orderId)
            .single();

        if (error || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json(order);
    } catch (error) {
        const logger = createRequestLogger(request);
        logger.error({ err: error }, 'Error fetching admin order');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/admin/orders/[orderId] - Update order status
export async function PUT(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { orderId } = await context.params;
        const supabase = await createClient();

        // Check admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (!profile?.is_admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Rate limit admin API calls
        const rateResultPut = checkRateLimit(`standard:${user.id}`, RATE_LIMITS.standard);
        if (!rateResultPut.allowed) {
            const loggerPut = createRequestLogger(request);
            loggerPut.info({ userId: user.id }, 'Rate limited: admin/orders/[orderId] PUT');
            return rateLimitResponse(rateResultPut);
        }

        const body = await request.json();
        const { status, trackingNumber, luluOrderId, sendEmail } = body;

        // Get current order for email data
        const { data: currentOrder } = await supabase
            .from('orders')
            .select(`
        *,
        books (title, child_name),
        profiles:user_id (email, full_name)
      `)
            .eq('id', orderId)
            .single();

        if (!currentOrder) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Build update object
        const updateData: Record<string, unknown> = {};
        if (status) updateData.payment_status = status;
        if (trackingNumber) updateData.tracking_number = trackingNumber;
        if (luluOrderId) updateData.lulu_order_id = luluOrderId;

        // Update order
        const { data: order, error } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', orderId)
            .select()
            .single();

        if (error) {
            const logger = createRequestLogger(request);
            logger.error({ err: error }, 'Update error');
            return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
        }

        // Send email notifications if requested
        if (sendEmail && currentOrder.profiles?.email) {
            const baseEmailData: OrderEmailData = {
                orderId: order.id,
                customerEmail: currentOrder.profiles.email,
                customerName: currentOrder.profiles.full_name || 'Customer',
                bookTitle: currentOrder.books?.title || 'Personalized Book',
                childName: currentOrder.books?.child_name || 'your child',
                format: order.format,
                size: order.size,
                quantity: order.quantity,
                total: order.total,
                shippingAddress: {
                    fullName: order.shipping_full_name,
                    addressLine1: order.shipping_address_line1,
                    addressLine2: order.shipping_address_line2,
                    city: order.shipping_city,
                    state: order.shipping_state,
                    postalCode: order.shipping_postal_code,
                    country: order.shipping_country,
                },
            };

            if (status === 'shipped' && trackingNumber) {
                const shippingData: ShippingEmailData = {
                    ...baseEmailData,
                    trackingNumber,
                    trackingUrl: `https://www.ups.com/track?tracknum=${trackingNumber}`,
                    carrier: 'UPS',
                    estimatedDelivery: getEstimatedDelivery(),
                };
                await sendShippingNotification(shippingData);
            } else if (status === 'delivered') {
                await sendDeliveryConfirmation(baseEmailData);
            }
        }

        return NextResponse.json(order);
    } catch (error) {
        const logger = createRequestLogger(request);
        logger.error({ err: error }, 'Error updating admin order');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

function getEstimatedDelivery(): string {
    const date = new Date();
    date.setDate(date.getDate() + 5);
    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}
