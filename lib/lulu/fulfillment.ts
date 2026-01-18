// ============================================
// Lulu Fulfillment Orchestrator
// ============================================
// Coordinates PDF generation, upload, and print job creation

import { createClient } from '@/lib/supabase/server';
import { createLuluClient } from './client';
import { generateInteriorPDF } from './pdf-generator';
import { generateCoverPDF } from './cover-generator';
import { Book } from '@/lib/types';

/**
 * Fulfillment status enum
 */
export enum FulfillmentStatus {
    PENDING = 'PENDING',
    GENERATING_PDFS = 'GENERATING_PDFS',
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
    };
    return countryMap[country] || 'US';
}

/**
 * Fulfill an order by generating PDFs and submitting to Lulu
 */
export async function fulfillOrder(orderId: string): Promise<FulfillmentResult> {
    const supabase = await createClient();

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

        // 2. Fetch book data
        const { data: bookRecord, error: bookError } = await supabase
            .from('books')
            .select('*, pages(*)')
            .eq('id', orderData.book_id)
            .single();

        if (bookError || !bookRecord) {
            return {
                status: FulfillmentStatus.FAILED,
                error: `Book not found: ${orderData.book_id}`,
            };
        }

        // Transform database record to Book type
        const book: Book = {
            id: bookRecord.id,
            status: bookRecord.status || 'completed',
            createdAt: new Date(bookRecord.created_at),
            updatedAt: new Date(bookRecord.updated_at),
            thumbnailUrl: bookRecord.thumbnail_url,
            settings: {
                childName: bookRecord.child_name,
                childAge: bookRecord.child_age,
                ageGroup: bookRecord.age_group || '3-5',
                bookTheme: bookRecord.book_theme,
                bookType: bookRecord.book_type,
                title: bookRecord.title,
            },
            pages: bookRecord.pages.map((p: any) => ({
                id: p.id,
                pageNumber: p.page_number,
                type: p.page_type,
                backgroundColor: p.background_color || '#ffffff',
                backgroundImage: p.image_elements?.[0]?.src,
                textElements: p.text_elements || [],
                imageElements: p.image_elements || [],
                createdAt: new Date(p.created_at),
                updatedAt: new Date(p.updated_at),
            })),
        };

        // Update order status
        await updateOrderStatus(supabase, orderId, FulfillmentStatus.GENERATING_PDFS);

        // 3. Generate Interior PDF
        console.log(`[Fulfillment] Generating interior PDF for order ${orderId}...`);
        const interiorPDF = await generateInteriorPDF(book, orderData.format, orderData.size);

        // 4. Generate Cover PDF
        console.log(`[Fulfillment] Generating cover PDF for order ${orderId}...`);
        const coverPDF = await generateCoverPDF(book, orderData.format, orderData.size);

        await updateOrderStatus(supabase, orderId, FulfillmentStatus.UPLOADING);

        // 5. Upload to Lulu
        console.log(`[Fulfillment] Uploading PDFs to Lulu...`);
        const luluClient = createLuluClient();

        const interiorPrintableId = await luluClient.uploadPrintFile(
            interiorPDF,
            `${book.id}_interior.pdf`
        );

        const coverPrintableId = await luluClient.uploadPrintFile(
            coverPDF,
            `${book.id}_cover.pdf`
        );

        await updateOrderStatus(supabase, orderId, FulfillmentStatus.CREATING_JOB);

        // 6. Create Print Job
        console.log(`[Fulfillment] Creating print job...`);
        const printJob = await luluClient.createPrintJob({
            lineItems: [{
                printableId: interiorPrintableId,
                quantity: orderData.quantity,
                productSpec: {
                    podPackageId: getLuluProductId(orderData.format, orderData.size),
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

        // 7. Update order with print job ID
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
            interiorPrintableId,
            coverPrintableId,
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

/**
 * Update order fulfillment status
 */
async function updateOrderStatus(supabase: any, orderId: string, status: FulfillmentStatus): Promise<void> {
    await supabase
        .from('orders')
        .update({ fulfillment_status: status })
        .eq('id', orderId);
}

/**
 * Get Lulu product ID for format/size combination
 */
function getLuluProductId(format: 'softcover' | 'hardcover', size: '6x6' | '8x8' | '8x10'): string {
    const PRODUCT_IDS: Record<string, Record<string, string>> = {
        softcover: {
            '6x6': '0600X0600SCPERFCOLSTD',
            '8x8': '0800X0800SCPERFCOLSTD',
            '8x10': '0800X1000SCPERFCOLSTD',
        },
        hardcover: {
            '6x6': '0600X0600HCPERFCOLSTD',
            '8x8': '0800X0800HCPERFCOLSTD',
            '8x10': '0800X1000HCPERFCOLSTD',
        },
    };
    return PRODUCT_IDS[format][size];
}
