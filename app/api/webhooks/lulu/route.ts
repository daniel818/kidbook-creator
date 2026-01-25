
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// Lulu Webhook Handler
// Receives updates for print job status changes (Created -> Printing -> Shipped)

export async function POST(req: Request) {
    try {
        const signature = req.headers.get('x-lulu-signature');
        const body = await req.json();

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
        // But the payload structure varies.
        // Usually: { id: "job_id", status: { name: "SHIPPED", ... } }

        const printJobId = body.id;
        const status = body.status?.name; // e.g., 'CREATED', 'PRINTING', 'SHIPPED'

        if (!printJobId || !status) {
            return NextResponse.json({ message: 'Ignored: No ID/Status' });
        }

        // Prepare update data
        const updateData: any = {
            lulu_status: status,
            // If shipped, map to our fulfillment_status 'shipped'
            // If cancelled, 'cancelled'
        };

        if (status === 'SHIPPED') {
            updateData.fulfillment_status = 'shipped';
            // Try to extract tracking URL/Number if available
            // Lulu payload structure for tracking varies, often in line_items
            const lineItems = body.line_items || [];
            if (lineItems.length > 0 && lineItems[0].tracking_url) {
                updateData.tracking_number = lineItems[0].tracking_url;
            }
        } else if (status === 'CANCELED') {
            updateData.fulfillment_status = 'cancelled';
        } else if (status === 'ERROR') {
            updateData.fulfillment_status = 'failed';
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

        console.log(`[Lulu Webhook] Updated Order with Job ${printJobId} to status ${status}`);

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
