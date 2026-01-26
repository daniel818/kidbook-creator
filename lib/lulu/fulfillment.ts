// ============================================
// Lulu Fulfillment Orchestrator
// ============================================
// Coordinates PDF generation, upload, and print job creation

import { createAdminClient } from '@/lib/supabase/server';
import { createLuluClient, ShippingLevel } from './client';
import { Book } from '@/lib/types';
import { getPrintableInteriorPageCount } from './page-count';

/**
 * Fulfillment status enum
 */
export enum FulfillmentStatus {
    PENDING = 'PENDING',
    GENERATING_PDFS = 'GENERATING_PDFS', // Used by client to indicate generation in progress
    UPLOADING = 'UPLOADING',
    CREATING_JOB = 'CREATING_JOB',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
}

/**
 * Fulfillment result
 */
export interface FulfillmentResult {
    status: FulfillmentStatus;
    printJobId?: string;
    interiorPrintableId?: string;
    coverPrintableId?: string;
    error?: string;
}

/**
 * Order data from database
 */
interface OrderData {
    id: string;
    book_id: string;
    format: 'softcover' | 'hardcover';
    size: '6x6' | '8x8' | '8x10';
    quantity: number;
    shipping_level?: string;
    shipping_full_name: string;
    shipping_address_line1: string;
    shipping_address_line2?: string;
    shipping_city: string;
    shipping_state: string;
    shipping_postal_code: string;
    shipping_country: string;
    shipping_phone: string;
    user_email?: string;
    pdf_url?: string;       // Interior PDF path
    cover_pdf_url?: string; // Cover PDF path
}

/**
 * Map country name to ISO code
 */
function getCountryCode(country: string): string {
    const countryMap: Record<string, string> = {
        'United States': 'US',
        'Canada': 'CA',
        'United Kingdom': 'GB',
        'Australia': 'AU',
        'Germany': 'DE',
        'France': 'FR',
        'Israel': 'IL', // Added Israel
    };
    // Return mapped code, or assuming it's already an ISO code (2 chars) return it, else default to US
    return countryMap[country] || (country.length === 2 ? country : 'US');
}

/**
 * Fulfill an order using pre-generated PDFs from storage
 */
export async function fulfillOrder(orderId: string, interiorPathOverride?: string, coverPathOverride?: string): Promise<FulfillmentResult> {
    const supabase = await createAdminClient();

    try {
        // 1. Fetch order details with Book to get Page Count
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, book:books(*, pages(*))') // Fetch book and pages relation
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return {
                status: FulfillmentStatus.FAILED,
                error: `Order not found: ${orderId}`,
            };
        }

        const orderData = order as OrderData & { book: Book & { pages: any[] } };
        // Determine interior page count (defaults to 32 if missing, but should exist)
        const rawInteriorPageCount = getPrintableInteriorPageCount(orderData.book, orderData.format, orderData.size);
        const interiorPageCount = rawInteriorPageCount > 0 ? rawInteriorPageCount : 32;

        // ... (path determination logic same as before) ...
        const interiorPath = interiorPathOverride || orderData.pdf_url;
        const coverPath = coverPathOverride || orderData.cover_pdf_url;

        if (!interiorPath || !coverPath) {
            // ... error ...
            return { status: FulfillmentStatus.FAILED, error: 'Missing PDF paths' };
        }

        await updateOrderStatus(supabase, orderId, FulfillmentStatus.UPLOADING); // Keep as initial status

        // 2. Generate Signed URLs
        console.log(`[Fulfillment] Generating signed URLs for order ${orderId}...`);

        const { data: interiorUrl, error: interiorError } = await supabase.storage.from('book-pdfs').createSignedUrl(interiorPath, 86400);
        const { data: coverUrl, error: coverError } = await supabase.storage.from('book-pdfs').createSignedUrl(coverPath, 86400);

        if (!interiorUrl?.signedUrl || !coverUrl?.signedUrl) {
            throw new Error('Failed to generate signed URLs');
        }

        // Tunnel Rewrite Logic
        const tunnelUrl = process.env.TUNNEL_URL;
        const rewriteUrl = (url: string) => {
            if (tunnelUrl && (url.includes('127.0.0.1') || url.includes('localhost'))) {
                return url.replace(/http:\/\/(127\.0\.0\.1|localhost):\d+/, tunnelUrl);
            }
            return url;
        };

        const finalInteriorUrl = rewriteUrl(interiorUrl.signedUrl);
        const finalCoverUrl = rewriteUrl(coverUrl.signedUrl);

        // 3. Prepare for Job Creation
        const luluClient = createLuluClient();
        const podPackageId = getLuluProductId(orderData.format, orderData.size, interiorPageCount);

        console.log(`[Fulfillment] Processing Job for SKU: ${podPackageId} (Pages: ${interiorPageCount})`);

        // Skip explicit validation as per request - proceeding to job creation
        await updateOrderStatus(supabase, orderId, FulfillmentStatus.CREATING_JOB);

        // 4. Determine available shipping level
        let shippingLevel: ShippingLevel | undefined;
        try {
            const options = await luluClient.getShippingOptions({
                currency: 'USD',
                lineItems: [{
                    pageCount: interiorPageCount,
                    podPackageId: podPackageId,
                    quantity: orderData.quantity,
                }],
                shippingAddress: {
                    name: orderData.shipping_full_name,
                    street1: orderData.shipping_address_line1,
                    street2: orderData.shipping_address_line2,
                    city: orderData.shipping_city,
                    stateCode: orderData.shipping_state,
                    postalCode: orderData.shipping_postal_code,
                    countryCode: getCountryCode(orderData.shipping_country),
                    phoneNumber: orderData.shipping_phone,
                },
            });

            const preferredOrder: ShippingLevel[] = [
                'MAIL',
                'GROUND',
                'GROUND_HD',
                'GROUND_BUS',
                'PRIORITY_MAIL',
                'EXPEDITED',
                'EXPRESS',
            ];
            const available = new Set(options.map((opt) => opt.level));
            const requestedLevel = orderData.shipping_level as ShippingLevel | undefined;
            if (requestedLevel && available.has(requestedLevel)) {
                shippingLevel = requestedLevel;
            } else {
                shippingLevel = preferredOrder.find((level) => available.has(level)) || options[0]?.level;
            }
        } catch (error) {
            console.warn('[Fulfillment] Failed to fetch shipping options, defaulting to MAIL', error);
            shippingLevel = (orderData.shipping_level as ShippingLevel) || 'MAIL';
        }

        // 5. Create Print Job
        const printJob = await luluClient.createPrintJob({
            lineItems: [{
                title: orderData.book_id,
                cover: finalCoverUrl,
                interior: finalInteriorUrl,
                quantity: orderData.quantity,
                productSpec: {
                    podPackageId: podPackageId,
                },
            }],
            shippingAddress: {
                name: orderData.shipping_full_name,
                streetAddress: orderData.shipping_address_line1,
                streetAddress2: orderData.shipping_address_line2,
                city: orderData.shipping_city,
                stateCode: orderData.shipping_state,
                postalCode: orderData.shipping_postal_code,
                countryCode: getCountryCode(orderData.shipping_country),
                phoneNumber: orderData.shipping_phone,
            },
            contactEmail: orderData.user_email || 'orders@kidbook-creator.com',
            externalId: orderId,
            shippingLevel,
        });

        // 5. Update Success
        await supabase.from('orders').update({
            lulu_print_job_id: printJob.id,
            lulu_status: printJob.status,
            fulfillment_status: FulfillmentStatus.SUCCESS,
        }).eq('id', orderId);

        console.log(`[Fulfillment] Success! Job ID: ${printJob.id}`);

        return {
            status: FulfillmentStatus.SUCCESS,
            printJobId: printJob.id,
        };

    } catch (error) {
        console.error(`[Fulfillment] Error fulfilling order ${orderId}:`, error);

        // Update order with error
        await supabase.from('orders').update({
            fulfillment_status: FulfillmentStatus.FAILED,
            fulfillment_error: error instanceof Error ? error.message : String(error),
        }).eq('id', orderId);

        return {
            status: FulfillmentStatus.FAILED,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

async function updateOrderStatus(supabase: any, orderId: string, status: FulfillmentStatus): Promise<void> {
    await supabase
        .from('orders')
        .update({ fulfillment_status: status })
        .eq('id', orderId);
}

// Update signature to accept page count
export function getLuluProductId(format: 'softcover' | 'hardcover', size: '6x6' | '8x8' | '8x10', pageCount: number): string {
    // 1. Saddle Stitch Logic (Min 4, Max ~48/80 depending on paper)
    // If pages are too few for Perfect Bound (32), try Saddle Stitch
    if (pageCount < 32 && format === 'softcover') {
        if (size === '8x8') {
            // Validated Sandbox SKU for 8.5x8.5 Premium Saddle Stitch
            return '0850X0850FCPRESS080CW444GXX';
        }
    }

    // 2. Default Perfect Bound / Casewrap
    const PRODUCT_IDS: Record<string, Record<string, string>> = {
        softcover: {
            '6x6': '0600X0600SCPERFCOLSTD',
            '8x8': '0850X0850FCSTDPB080CW444GXX', // Standard Perfect Bound (Verified)
            '8x10': '0850X1100FCSTDPB080CW444GXX', // Standard Perfect Bound
        },
        hardcover: {
            '6x6': '0600X0600HCPERFCOLSTD',
            '8x8': '0850X0850FCSTDCW080CW444GXX', // Hardcover Casewrap (Verified 201)
            '8x10': '0850X1100FCSTDCW080CW444GXX', // Hardcover Casewrap
        },
    };
    // Default to Softcover 8x8 if unknown
    return PRODUCT_IDS[format]?.[size] || PRODUCT_IDS['softcover']['8x8'];
}
