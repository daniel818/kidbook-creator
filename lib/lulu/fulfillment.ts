// ============================================
// Lulu Fulfillment Orchestrator
// ============================================
// Coordinates PDF generation, upload, and print job creation

import { createAdminClient } from '@/lib/supabase/server';
import { createLuluClient } from './client';
import { Book } from '@/lib/types';

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
export async function fulfillOrder(
    orderId: string,
    interiorPathOverride?: string,
    coverPathOverride?: string
): Promise<FulfillmentResult> {
    const supabase = await createAdminClient();

    try {
        // 1. Fetch order details
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return {
                status: FulfillmentStatus.FAILED,
                error: `Order not found: ${orderId}`,
            };
        }

        const orderData = order as OrderData;

        // Determine file paths (override takes precedence, then DB, then fail)
        const interiorPath = interiorPathOverride || orderData.pdf_url;
        const coverPath = coverPathOverride || orderData.cover_pdf_url;

        if (!interiorPath || !coverPath) {
            return {
                status: FulfillmentStatus.FAILED,
                error: `Missing PDF paths for order ${orderId}. Files must be generated first.`,
            };
        }

        await updateOrderStatus(supabase, orderId, FulfillmentStatus.UPLOADING);

        // 2. Generate Signed URLs for generic public access by Lulu
        // Instead of downloading and re-uploading, we give Lulu a temporary URL to fetch.
        console.log(`[Fulfillment] Generating signed URLs for order ${orderId}...`);

        const { data: interiorUrl, error: interiorError } = await supabase.storage
            .from('book-pdfs')
            .createSignedUrl(interiorPath, 86400); // 24 hours

        if (interiorError || !interiorUrl) {
            throw new Error(`Failed to create signed URL for interior: ${interiorError?.message}`);
        }

        const { data: coverUrl, error: coverError } = await supabase.storage
            .from('book-pdfs')
            .createSignedUrl(coverPath, 86400); // 24 hours

        if (coverError || !coverUrl) {
            throw new Error(`Failed to create signed URL for cover: ${coverError?.message}`);
        }

        await updateOrderStatus(supabase, orderId, FulfillmentStatus.CREATING_JOB);

        // 3. Create Print Job with External URLs
        console.log(`[Fulfillment] Creating print job...`);
        const luluClient = createLuluClient();

        // If we represent a local Supabase, we must expose it via a Tunnel for Lulu to reach it.
        const tunnelUrl = process.env.TUNNEL_URL;
        const rewriteUrl = (url: string) => {
            if (tunnelUrl && (url.includes('127.0.0.1') || url.includes('localhost'))) {
                return url.replace(/http:\/\/(127\.0\.0\.1|localhost):\d+/, tunnelUrl);
            }
            return url;
        };

        const printJob = await luluClient.createPrintJob({
            lineItems: [{
                title: orderData.book_id, // Using Book ID as title reference
                cover: rewriteUrl(coverUrl.signedUrl),
                interior: rewriteUrl(interiorUrl.signedUrl),
                quantity: orderData.quantity,
                productSpec: {
                    podPackageId: getLuluProductId(orderData.format, orderData.size, 24), // TODO: Fetch actual page count from order metadata
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
        });

        // 4. Update order with print job ID
        await supabase
            .from('orders')
            .update({
                lulu_print_job_id: printJob.id,
                lulu_status: printJob.status,
                fulfillment_status: FulfillmentStatus.SUCCESS,
            })
            .eq('id', orderId);

        console.log(`[Fulfillment] Order ${orderId} fulfilled successfully! Print job: ${printJob.id}`);

        return {
            status: FulfillmentStatus.SUCCESS,
            printJobId: printJob.id,
        };

    } catch (error) {
        console.error(`[Fulfillment] Error fulfilling order ${orderId}:`, error);

        // Update order with error
        await supabase
            .from('orders')
            .update({
                fulfillment_status: FulfillmentStatus.FAILED,
                fulfillment_error: error instanceof Error ? error.message : String(error),
            })
            .eq('id', orderId);

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
function getLuluProductId(format: 'softcover' | 'hardcover', size: '6x6' | '8x8' | '8x10', pageCount: number): string {
    // 1. Saddle Stitch Logic (Min 4, Max ~48/80 depending on paper)
    // If pages are too few for Perfect Bound (32), try Saddle Stitch
    if (pageCount < 32 && format === 'softcover') {
        if (size === '8x8') {
            // Validated Sandbox SKU for 8.5x8.5 Premium Saddle Stitch
            return '0850X0850FCPRESS080CW444GXX';
        }
    }

    // 2. Default Perfect Bound
    const PRODUCT_IDS: Record<string, Record<string, string>> = {
        softcover: {
            '6x6': '0600X0600SCPERFCOLSTD',
            '8x8': '0850X0850FCSTDPB080CW444GXX', // 8.5x8.5 Perfect Bound
            '8x10': '0800X1000SCPERFCOLSTD',
        },
        hardcover: {
            '6x6': '0600X0600HCPERFCOLSTD',
            '8x8': '0850X0850HCPERFCOLSTD', // Guessing similar
            '8x10': '0800X1000HCPERFCOLSTD',
        },
    };
    return PRODUCT_IDS[format][size];
}
