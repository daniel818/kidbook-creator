import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { fulfillOrder } from '@/lib/lulu/fulfillment';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId, interiorPath, coverPath } = body;

        if (!orderId || !interiorPath || !coverPath) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = await createAdminClient();

        // 1. Verify and Update Order with PDF paths
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                pdf_url: interiorPath,
                cover_pdf_url: coverPath,
                fulfillment_status: 'GENERATING_PDFS' // Marking as "Files Received" conceptually
            })
            .eq('id', orderId);

        if (updateError) {
            console.error('Failed to update order with PDF paths:', updateError);
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }

        // 2. Trigger Fulfillment (async, but we await it here for simplicity since client is waiting)
        // In a production queue system, this would be a background job.
        // For now, we await it so the client gets a definitive "Success" or "Fail".
        console.log(`[API] Triggering fulfillment for order ${orderId} with provided files...`);
        const result = await fulfillOrder(orderId, interiorPath, coverPath);

        if (result.status === 'SUCCESS' || result.status === 'CREATING_JOB') {
            return NextResponse.json({ success: true, result });
        } else {
            return NextResponse.json(
                { error: 'Fulfillment failed to create print job', details: result },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('Fulfillment API Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
