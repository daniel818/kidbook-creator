// ============================================
// Attach PDF Paths to Order
// ============================================
// Called after PDFs are generated and uploaded, but before payment confirmation.
// Ensures the order record has the PDF paths before payment goes through.

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createRequestLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
    const logger = createRequestLogger(request);
    try {
        const supabase = await createClient();
        const adminDb = await createAdminClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { orderId, pdfUrl, coverUrl } = body;

        // Validate required fields
        if (!orderId || !pdfUrl || typeof pdfUrl !== 'string') {
            return NextResponse.json({ error: 'Missing or invalid interior PDF path' }, { status: 400 });
        }
        if (!coverUrl || typeof coverUrl !== 'string') {
            return NextResponse.json({ error: 'Missing or invalid cover PDF path' }, { status: 400 });
        }

        // Update order with PDF paths (only if the user owns it and it's still pending)
        const { data: order, error: updateError } = await adminDb
            .from('orders')
            .update({
                pdf_url: pdfUrl,
                cover_pdf_url: coverUrl,
            })
            .eq('id', orderId)
            .eq('user_id', user.id)
            .eq('payment_status', 'pending')
            .select('id')
            .single();

        if (updateError || !order) {
            logger.error({ err: updateError }, 'Attach PDFs error');
            return NextResponse.json(
                { error: 'Failed to attach PDFs to order. Order may not exist, may not belong to you, or may already be paid.' },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        logger.error({ err: error }, 'Attach PDFs error');
        return NextResponse.json(
            { error: 'Failed to attach PDFs to order' },
            { status: 500 }
        );
    }
}
