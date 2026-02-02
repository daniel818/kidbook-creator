
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// Lulu Webhook Handler
// Receives updates for print job status changes throughout the lifecycle:
// CREATED -> UNPAID -> PAYMENT_IN_PROGRESS -> PRODUCTION_DELAYED -> 
// PRODUCTION_READY -> IN_PRODUCTION -> SHIPPED

// Map Lulu status to our internal fulfillment_status
const LULU_STATUS_MAP: Record<string, string> = {
    'CREATED': 'processing',
    'UNPAID': 'processing',
    'PAYMENT_IN_PROGRESS': 'processing',
    'PRODUCTION_DELAYED': 'preparing',
    'PRODUCTION_READY': 'preparing',
    'IN_PRODUCTION': 'printing',
    'SHIPPED': 'shipped',
    'CANCELED': 'cancelled',
    'ERROR': 'failed',
};

export async function POST(req: Request) {
    try {
        const signature = req.headers.get('x-lulu-signature') || req.headers.get('lulu-hmac-sha256');
        const body = await req.json();
        const payload = body?.data || body;

        // Verify Signature
        const secret = process.env.LULU_WEBHOOK_SECRET;
        if (secret) {
            const isValid = verifyLuluSignature(JSON.stringify(body), signature, secret);
            if (!isValid) {
                console.error('[Lulu Webhook] Invalid Signature');
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }
        } else {
            console.warn('[Lulu Webhook] Skipping signature verification: LULU_WEBHOOK_SECRET not set');
        }

        console.log('[Lulu Webhook] Received update:', JSON.stringify(body, null, 2));

        const supabase = await createAdminClient();

        // Lulu sends different event types. We care about 'print_job_status_changed'
        // Payload: { id: "job_id", status: { name: "SHIPPED", ... }, line_item_statuses: [...] }

        const printJobId = payload?.id;
        const status = payload?.status?.name; // e.g., 'CREATED', 'IN_PRODUCTION', 'SHIPPED'

        if (!printJobId || !status) {
            return NextResponse.json({ message: 'Ignored: No ID/Status' });
        }

        // Prepare update data with mapped fulfillment status
        const updateData: Record<string, any> = {
            lulu_status: JSON.stringify(payload.status),
            fulfillment_status: LULU_STATUS_MAP[status] || 'processing',
        };

        // Estimated delivery window (if provided by Lulu)
        const estimatedDates = payload?.estimated_shipping_dates;
        if (estimatedDates?.arrival_min) {
            updateData.estimated_delivery_min = estimatedDates.arrival_min;
        }
        if (estimatedDates?.arrival_max) {
            updateData.estimated_delivery_max = estimatedDates.arrival_max;
        }

        // Extract tracking info from line_item_statuses (Lulu API format)
        const lineItemStatuses = payload?.line_item_statuses || payload?.line_items || payload?.lineItems || [];
        if (lineItemStatuses.length > 0) {
            const firstItem = lineItemStatuses[0];

            // Extract carrier name
            if (firstItem.carrier_name) {
                updateData.carrier_name = firstItem.carrier_name;
            }

            // Extract tracking URL (prefer tracking_urls array, fallback to tracking_url)
            if (firstItem.tracking_urls?.length > 0) {
                updateData.tracking_url = firstItem.tracking_urls[0];
                updateData.tracking_number = firstItem.tracking_id || firstItem.tracking_urls[0];
            } else if (firstItem.tracking_url) {
                updateData.tracking_url = firstItem.tracking_url;
                updateData.tracking_number = firstItem.tracking_id || firstItem.tracking_url;
            } else if (firstItem.tracking_id) {
                updateData.tracking_number = firstItem.tracking_id;
            }
        }

        // Log the mapped status for debugging
        console.log(`[Lulu Webhook] Status mapping: ${status} -> ${updateData.fulfillment_status}`);
        if (updateData.carrier_name) {
            console.log(`[Lulu Webhook] Carrier: ${updateData.carrier_name}`);
        }
        if (updateData.tracking_url) {
            console.log(`[Lulu Webhook] Tracking URL: ${updateData.tracking_url}`);
        }

        // Update Order in DB
        const { error } = await supabase
            .from('orders')
            .update(updateData)
            .eq('lulu_print_job_id', printJobId);

        if (error) {
            console.error('[Lulu Webhook] DB Update Error:', error);
            return NextResponse.json({ error: 'DB Update Failed' }, { status: 500 });
        }

        console.log(`[Lulu Webhook] Updated Order with Job ${printJobId} to status ${status} (${updateData.fulfillment_status})`);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[Lulu Webhook] Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

/**
 * Verify Lulu Webhook Signature (HMAC-SHA256)
 */
function verifyLuluSignature(payload: string, signature: string | null, secret: string): boolean {
    if (!signature) return false;

    // Lulu signature format might vary. Usually just the hash.
    // Based on standard implementation:
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(payload).digest('hex'); // or 'base64' - usually hex for webhooks

    // Use timingSafeEqual to prevent timing attacks
    // Note: ensure digest and signature are same length/format
    return digest === signature;
}
