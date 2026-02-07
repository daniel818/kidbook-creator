// ============================================
// Manual Fulfillment Trigger API
// ============================================
// Use this to retry failed fulfillment for paid orders

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { fulfillOrder, FulfillmentStatus } from '@/lib/lulu/fulfillment';
import { checkRateLimit, rateLimitResponse, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
    try {
        // Rate limit by IP (no user auth on this route)
        const ip = getClientIp(request);
        const rateResult = checkRateLimit(`standard:ip:${ip}`, RATE_LIMITS.standard);
        if (!rateResult.allowed) {
            console.log(`[Rate Limit] fulfillment/trigger blocked for IP ${ip}`);
            return rateLimitResponse(rateResult);
        }

        const { orderId, force } = await request.json();

        if (!orderId) {
            return NextResponse.json({ error: 'orderId required' }, { status: 400 });
        }

        const supabase = await createAdminClient();

        // Verify order exists and is paid
        const { data: order, error } = await supabase
            .from('orders')
            .select('id, payment_status, fulfillment_status')
            .eq('id', orderId)
            .single();

        if (error || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (order.payment_status !== 'paid') {
            return NextResponse.json({
                error: 'Order not paid',
                payment_status: order.payment_status
            }, { status: 400 });
        }

        // Don't re-trigger if already successful (unless forced)
        if (!force && (order.fulfillment_status === 'SUCCESS' || order.fulfillment_status === 'shipped')) {
            return NextResponse.json({
                message: 'Order already fulfilled',
                fulfillment_status: order.fulfillment_status
            });
        }

        // Trigger fulfillment
        console.log(`[Fulfillment API] Triggering for order: ${orderId}`);
        const result = await fulfillOrder(orderId);

        if (result.status === FulfillmentStatus.SUCCESS) {
            return NextResponse.json({
                success: true,
                message: 'Fulfillment triggered successfully',
                printJobId: result.printJobId
            });
        } else {
            return NextResponse.json({
                success: false,
                error: result.error,
                status: result.status
            }, { status: 500 });
        }

    } catch (error) {
        console.error('[Fulfillment API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
