
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

/** Fields that may be updated on the orders table from a Lulu webhook. */
interface OrderUpdateData {
    lulu_status: string;
    fulfillment_status: string;
    estimated_delivery_min?: string;
    estimated_delivery_max?: string;
    carrier_name?: string;
    tracking_url?: string;
    tracking_number?: string;
}

export async function POST(req: Request) {
    try {
        // Lulu sends the HMAC in the "Lulu-HMAC-SHA256" header (case-insensitive).
        // We also check the legacy "x-lulu-signature" header as a fallback.
        const signature = req.headers.get('lulu-hmac-sha256') || req.headers.get('x-lulu-signature');

        // Require webhook secret — reject all webhooks if not configured
        const secret = process.env.LULU_WEBHOOK_SECRET;
        if (!secret) {
            console.error('[Lulu Webhook] CRITICAL: LULU_WEBHOOK_SECRET is not configured. Rejecting webhook.');
            return NextResponse.json(
                { error: 'Webhook verification not configured' },
                { status: 500 }
            );
        }

        // Use raw body for signature verification to avoid re-serialization differences
        const rawBody = await req.text();

        // Verify signature against raw body
        const isValid = verifyLuluSignature(rawBody, signature, secret);
        if (!isValid) {
            console.error('[Lulu Webhook] Invalid Signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // Parse body AFTER signature verification
        let body: Record<string, unknown>;
        try {
            body = JSON.parse(rawBody);
        } catch {
            return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
        }

        // Validate payload structure
        if (!body || typeof body !== 'object') {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        console.log('[Lulu Webhook] Received update:', JSON.stringify(body, null, 2));

        const supabase = await createAdminClient();

        // Lulu sends different event types. We care about 'print_job_status_changed'
        // Payload: { id: "job_id", status: { name: "SHIPPED", ... }, line_item_statuses: [...] }

        const rawPayload = body?.data ?? body;
        // Ensure payload is a non-null, non-array object
        if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)) {
            return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 });
        }
        const payload = rawPayload as Record<string, unknown>;
        const printJobId = typeof payload.id === 'string' ? payload.id : undefined;
        const statusObj = (payload.status && typeof payload.status === 'object' && !Array.isArray(payload.status))
            ? payload.status as Record<string, unknown>
            : undefined;
        const status = typeof statusObj?.name === 'string' ? statusObj.name : undefined;

        if (!printJobId || !status) {
            return NextResponse.json({ message: 'Ignored: No ID/Status' });
        }

        // Prepare update data with mapped fulfillment status
        const updateData: OrderUpdateData = {
            lulu_status: JSON.stringify(statusObj),
            fulfillment_status: LULU_STATUS_MAP[status] || 'processing',
        };

        // Estimated delivery window (if provided by Lulu)
        const rawEstimatedDates = payload?.estimated_shipping_dates;
        const estimatedDates = (rawEstimatedDates && typeof rawEstimatedDates === 'object' && !Array.isArray(rawEstimatedDates))
            ? rawEstimatedDates as Record<string, string>
            : undefined;
        if (estimatedDates?.arrival_min) {
            updateData.estimated_delivery_min = estimatedDates.arrival_min;
        }
        if (estimatedDates?.arrival_max) {
            updateData.estimated_delivery_max = estimatedDates.arrival_max;
        }

        // Extract tracking info from line_item_statuses (Lulu API format)
        const rawLineItems = payload?.line_item_statuses || payload?.line_items || payload?.lineItems;
        const lineItemStatuses: Record<string, unknown>[] = Array.isArray(rawLineItems) ? rawLineItems : [];
        if (lineItemStatuses.length > 0) {
            const firstItem = lineItemStatuses[0];

            // Extract carrier name
            if (firstItem.carrier_name) {
                updateData.carrier_name = firstItem.carrier_name as string;
            }

            // Extract tracking URL (prefer tracking_urls array, fallback to tracking_url)
            const trackingUrls = firstItem.tracking_urls as string[] | undefined;
            if (trackingUrls?.length && trackingUrls.length > 0) {
                updateData.tracking_url = trackingUrls[0];
                updateData.tracking_number = (firstItem.tracking_id as string) || trackingUrls[0];
            } else if (firstItem.tracking_url) {
                updateData.tracking_url = firstItem.tracking_url as string;
                updateData.tracking_number = (firstItem.tracking_id as string) || (firstItem.tracking_url as string);
            } else if (firstItem.tracking_id) {
                updateData.tracking_number = firstItem.tracking_id as string;
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

/** Regex for a valid lowercase hex-encoded SHA-256 digest (64 hex chars). */
const HEX_SHA256_RE = /^[0-9a-f]{64}$/;

/**
 * Verify Lulu Webhook Signature (HMAC-SHA256)
 * Uses crypto.timingSafeEqual to prevent timing attacks.
 * Compares raw hex bytes rather than UTF-8 strings for robustness.
 */
function verifyLuluSignature(payload: string, signature: string | null, secret: string): boolean {
    if (!signature) return false;

    // Normalize case and strip common HMAC prefixes (e.g., "sha256=", "SHA256=")
    const cleanSignature = signature.trim().toLowerCase().replace(/^sha256=/, '');

    // Validate the incoming signature looks like a hex SHA-256 digest
    if (!HEX_SHA256_RE.test(cleanSignature)) return false;

    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(payload).digest('hex');

    // Compare as hex-decoded byte buffers for a proper timing-safe comparison
    const sigBuffer = Buffer.from(cleanSignature, 'hex');
    const digestBuffer = Buffer.from(digest, 'hex');

    // Both buffers are 32 bytes (SHA-256), so lengths always match after validation above.
    // Guard anyway in case of future changes.
    if (sigBuffer.length !== digestBuffer.length) return false;

    return crypto.timingSafeEqual(sigBuffer, digestBuffer);
}
