import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createAdminClient } from '../lib/supabase/server';
import { createLuluClient } from '../lib/lulu/client';
import { getLuluProductId } from '../lib/lulu/fulfillment';
import { ShippingAddress, PrintJob } from '../lib/lulu/client';
import { createModuleLogger } from '../lib/logger';

const logger = createModuleLogger('script:validate-and-fulfill');

const TUNNEL_URL = process.env.TUNNEL_URL;

function rewriteUrl(url: string): string {
    if (TUNNEL_URL && (url.includes('127.0.0.1') || url.includes('localhost'))) {
        return url.replace(/http:\/\/(127\.0\.0\.1|localhost):\d+/, TUNNEL_URL);
    }
    return url;
}

// Map database Shipping Address to Lulu Shipping Address
function mapShippingAddress(orderAddr: any): ShippingAddress {
    return {
        name: orderAddr.shipping_full_name,
        streetAddress: orderAddr.shipping_address_line1,
        streetAddress2: orderAddr.shipping_address_line2 || undefined,
        city: orderAddr.shipping_city,
        stateCode: orderAddr.shipping_state,
        postalCode: orderAddr.shipping_postal_code,
        countryCode: orderAddr.shipping_country,
        phoneNumber: orderAddr.shipping_phone,
    };
}

async function main() {
    logger.info('--- Validate & Fulfill Order ---');
    const supabase = await createAdminClient();
    const client = createLuluClient();

    // 1. Get latest PAID but not FULFILLED order (or specific ID)
    const specificOrderId = process.argv[2];
    let order: any;

    if (specificOrderId) {
        const { data } = await supabase.from('orders').select('*').eq('id', specificOrderId).single();
        order = data;
    } else {
        const { data } = await supabase.from('orders').select('*').eq('status', 'paid').neq('fulfillment_status', 'SUCCESS').order('created_at', { ascending: false }).limit(1).single();
        order = data;
    }

    if (!order) {
        logger.error('No pending/specified order found.');
        return;
    }

    logger.info({ orderId: order.id, size: order.size, format: order.format }, 'Processing Order');

    // 2. Generate Signed URLs based on stored paths (from DB)
    // Assuming DB has 'pdf_url' and 'cover_pdf_url' storing the relative storage path (e.g., 'book-pdfs/...')
    // If not, we have to infer or fail. Previous code assumed orderData had them.
    const interiorPath = order.pdf_url;
    const coverPath = order.cover_pdf_url;

    if (!interiorPath || !coverPath) {
        logger.error('Order missing PDF paths (pdf_url, cover_pdf_url). Cannot fulfill.');
        return;
    }

    logger.info('Generating signed URLs...');

    // Create signed URLs
    const { data: interiorData } = await supabase.storage.from('book-pdfs').createSignedUrl(interiorPath, 3600);
    const { data: coverData } = await supabase.storage.from('book-pdfs').createSignedUrl(coverPath, 3600);

    if (!interiorData?.signedUrl || !coverData?.signedUrl) {
        logger.error('Failed to sign URLs');
        return;
    }

    const interiorUrl = rewriteUrl(interiorData.signedUrl);
    const coverUrl = rewriteUrl(coverData.signedUrl);

    logger.info({ interiorUrl: interiorUrl.substring(0, 50), coverUrl: coverUrl.substring(0, 50) }, 'Signed URLs generated');

    // 3. Determine Product Spec (SKU)
    // Assuming 32 pages for now, or fetch from book if needed
    const pageCount = 32;
    const podPackageId = getLuluProductId(order.format, order.size, pageCount);
    logger.info({ sku: podPackageId }, 'SKU');

    try {
        // 4. Validate Interior
        logger.info('--- Validating Interior ---');
        const interiorJobId = await client.validateInterior(interiorUrl, podPackageId);
        await client.pollValidationStatus(interiorJobId);
        logger.info('Interior Validated');

        // 5. Validate Cover (Needs page count)
        logger.info({ pageCount }, '--- Validating Cover ---');
        const coverJobId = await client.validateCover(coverUrl, podPackageId, pageCount);
        await client.pollValidationStatus(coverJobId);
        logger.info('Cover Validated');

        // 6. Create Print Job (If success)
        logger.info('--- Creating Print Job ---');

        const printJob: PrintJob = {
            externalId: order.id,
            contactEmail: order.user_email || 'orders@kidbook-creator.com',
            shippingAddress: mapShippingAddress(order),
            lineItems: [{
                title: order.book_id, // Use book ID as title reference
                cover: coverUrl,
                interior: interiorUrl,
                quantity: order.quantity,
                productSpec: {
                    podPackageId: podPackageId
                }
            }]
        };

        const result = await client.createPrintJob(printJob);
        logger.info({ printJobId: result.id }, 'Order Created Successfully');

        // Update DB
        await supabase.from('orders').update({
            fulfillment_status: 'SUCCESS',
            print_job_id: result.id, // Ensure this column matches your DB schema
            lulu_print_job_id: result.id
        }).eq('id', order.id);
        logger.info('DB Updated.');

    } catch (err: any) {
        logger.error({ err }, 'VALIDATION / FULFILLMENT FAILED');
        // Don't update DB status to Failed yet, let user retry.
    }
}

main().catch((err) => logger.error({ err }, 'Unhandled error'));
