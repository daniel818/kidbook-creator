// ============================================
// Lulu API Client
// ============================================
// Print-on-demand integration for book printing

import { createModuleLogger } from '@/lib/logger';
import { withRetry, HttpError, RETRY_CONFIGS } from '../retry';

const logger = createModuleLogger('lulu');

export interface LuluCredentials {
    apiKey: string;
    apiSecret: string;
    sandbox: boolean;
}

export interface PrintJob {
    lineItems: PrintJobLineItem[];
    shippingAddress: ShippingAddress;
    contactEmail: string;
    externalId?: string;
    shippingLevel?: ShippingLevel;
}

export interface PrintJobLineItem {
    printableId?: string;  // ID of the uploaded print file (Optional if using source URLs)
    cover?: string; // URL for cover PDF
    interior?: string; // URL for interior PDF
    quantity: number;
    title?: string;
    productSpec: ProductSpec;
}

export interface ProductSpec {
    podPackageId: string;  // Lulu product ID
}

export interface ShippingAddress {
    name: string;
    streetAddress: string;
    streetAddress2?: string;
    city: string;
    stateCode: string;
    postalCode: string;
    countryCode: string;
    phoneNumber: string;
}

export type ShippingLevel =
    | 'MAIL'
    | 'PRIORITY_MAIL'
    | 'GROUND_HD'
    | 'GROUND_BUS'
    | 'GROUND'
    | 'EXPEDITED'
    | 'EXPRESS';

export interface LuluOrder {
    id: string;
    status: string;
    lineItems: Array<{
        id: string;
        status: string;
        trackingId?: string;
        trackingUrls?: string[];
    }>;
}

// Lulu product IDs for different formats
const PRODUCT_IDS: Record<string, Record<string, string>> = {
    softcover: {
        '7.5x7.5': '0750X0750FCPREPB080CW444GXX',
        '8x8': '0850X0850FCPREPB080CW444GXX',
        '8x10': '0850X1100FCPREPB080CW444GXX',
    },
    hardcover: {
        '7.5x7.5': '0750X0750FCPRECW080CW444GXX',
        '8x8': '0850X0850FCPRECW080CW444GXX',
        '8x10': '0850X1100FCPRECW080CW444GXX',
    },
};

class LuluClient {
    private baseUrl: string;
    private accessToken: string | null = null;
    private tokenExpiry: Date | null = null;

    constructor(private credentials: LuluCredentials) {
        this.baseUrl = credentials.sandbox
            ? 'https://api.sandbox.lulu.com'
            : 'https://api.lulu.com';
    }

    private async getAccessToken(): Promise<string> {
        // Check if we have a valid cached token
        if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
            return this.accessToken;
        }

        // Request new token with retry
        const data = await withRetry(async () => {
            const response = await fetch(`${this.baseUrl}/auth/realms/glasstree/protocol/openid-connect/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: this.credentials.apiKey,
                    client_secret: this.credentials.apiSecret,
                }),
            });

            if (!response.ok) {
                throw new HttpError(`Failed to authenticate with Lulu: ${response.statusText}`, response.status);
            }

            return response.json();
        }, { ...RETRY_CONFIGS.lulu, maxRetries: 2, serviceLabel: 'Lulu Auth' });

        this.accessToken = data.access_token;
        this.tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000);

        return this.accessToken!;
    }

    private async request<T>(
        method: string,
        endpoint: string,
        body?: unknown,
        options?: { skipRetry?: boolean }
    ): Promise<T> {
        const token = await this.getAccessToken();
        const url = `${this.baseUrl}${endpoint}`;

        const doFetch = async () => {
            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'KidBookCreator/1.0',
                },
                body: body ? JSON.stringify(body) : undefined,
            });

            if (!response.ok) {
                const error = await response.text();
                throw new HttpError(`Lulu API error: ${response.status} - ${error}`, response.status);
            }

            return response.json() as Promise<T>;
        };

        if (options?.skipRetry) {
            return doFetch();
        }

        return withRetry(doFetch, RETRY_CONFIGS.lulu);
    }

    // Upload a print-ready file
    async uploadPrintFile(file: Blob, filename: string): Promise<string> {
        // Create the print file
        const createResponse = await this.request<{ id: string; upload_url: string }>(
            'POST',
            '/print-files/',
            { name: filename }
        );

        logger.info({ filename, fileSize: file.size, uploadUrl: createResponse.upload_url }, 'Uploading file');

        // Convert Blob to ArrayBuffer for reliable Node fetch upload
        const arrayBuffer = await file.arrayBuffer();

        // Upload the actual file with retry
        await withRetry(async () => {
            const uploadRes = await fetch(createResponse.upload_url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/pdf',
                },
                body: arrayBuffer,
            });

            if (!uploadRes.ok) {
                const errText = await uploadRes.text();
                logger.error({ status: uploadRes.status, error: errText }, 'Upload PUT failed');
                throw new HttpError(`Failed to upload file content: ${uploadRes.status}`, uploadRes.status);
            }
        }, { ...RETRY_CONFIGS.lulu, serviceLabel: 'Lulu Upload' });

        // Notify Lulu that upload is complete
        await this.request(
            'POST',
            `/print-files/${createResponse.id}/upload-complete/`
        );

        return createResponse.id;
    }

    // Create a print job (order)
    async createPrintJob(job: PrintJob): Promise<LuluOrder> {
        const payload = {
            contact_email: job.contactEmail,
            external_id: job.externalId,
            line_items: job.lineItems.map(item => ({
                printable_id: item.printableId,
                cover: item.cover,
                interior: item.interior,
                title: item.title || 'Personalized Book', // Lulu often requires a title
                quantity: item.quantity,
                pod_package_id: item.productSpec.podPackageId,
            })),
            shipping_address: {
                name: job.shippingAddress.name,
                street1: job.shippingAddress.streetAddress,
                street2: job.shippingAddress.streetAddress2,
                city: job.shippingAddress.city,
                state_code: job.shippingAddress.stateCode,
                postcode: job.shippingAddress.postalCode, // Changed from postal_code to postcode based on error message
                country_code: job.shippingAddress.countryCode,
                phone_number: job.shippingAddress.phoneNumber,
            },
            shipping_level: job.shippingLevel || 'MAIL',
        };

        logger.info({ payload }, 'Creating print job');
        return this.request('POST', '/print-jobs/', payload);
    }

    // Get print job status
    async getPrintJob(printJobId: string): Promise<LuluOrder> {
        return this.request('GET', `/print-jobs/${printJobId}/`);
    }

    // Cancel a print job
    async cancelPrintJob(printJobId: string): Promise<void> {
        await this.request('PUT', `/print-jobs/${printJobId}/status/`, { name: 'CANCELED' });
    }

    // Get product ID for book format
    static getProductId(format: 'softcover' | 'hardcover', size: '7.5x7.5' | '8x8' | '8x10'): string {
        return PRODUCT_IDS[format][size];
    }

    // Calculate print job cost without creating an order
    async calculateCost(options: CostCalculationOptions): Promise<CostCalculationResult> {
        const podPackageId = options.podPackageId || PRODUCT_IDS[options.format]?.[options.size];
        if (!podPackageId) {
            throw new Error(`Invalid format/size combination: ${options.format}/${options.size}`);
        }

        const payload = {
            line_items: [{
                page_count: options.pageCount,
                pod_package_id: podPackageId,
                quantity: options.quantity,
            }],
            shipping_address: {
                name: options.name,
                street1: options.street1 || '123 Main St',
                street2: options.street2,
                city: options.shippingCity || 'New York',
                country_code: options.countryCode || 'US',
                postcode: options.postalCode || '10001',
                state_code: options.stateCode || 'NY',
                phone_number: options.phoneNumber,
            },
            shipping_option: options.shippingOption || 'MAIL',
        };

        const response = await this.request<LuluCostResponse>('POST', '/print-job-cost-calculations/', payload);

        // Extract costs from response
        const lineItemCost = response.line_item_costs?.[0];
        const productCost = parseFloat(lineItemCost?.total_cost_incl_tax || '0') * 100; // Convert to cents
        const shippingCost = parseFloat(response.shipping_cost?.total_cost_incl_tax || '0') * 100;
        const totalWholesale = parseFloat(response.total_cost_incl_tax || '0') * 100;

        return {
            productCost,      // cents
            shippingCost,     // cents
            totalWholesale,   // cents (Lulu's price before your markup)
            currency: response.currency || 'USD',
        };
    }

    async getShippingOptions(options: ShippingOptionRequest): Promise<ShippingOption[]> {
        const payload = {
            currency: options.currency || 'USD',
            line_items: options.lineItems.map((item) => ({
                page_count: item.pageCount,
                pod_package_id: item.podPackageId,
                quantity: item.quantity,
            })),
            shipping_address: {
                name: options.shippingAddress.name,
                street1: options.shippingAddress.street1,
                street2: options.shippingAddress.street2,
                city: options.shippingAddress.city,
                state_code: options.shippingAddress.stateCode,
                postcode: options.shippingAddress.postalCode,
                country: options.shippingAddress.countryCode,
                phone_number: options.shippingAddress.phoneNumber,
            },
        };

        return this.request('POST', '/shipping-options/', payload);
    }
    // Create a webhook subscription
    async createWebhook(url: string): Promise<any> {
        logger.info({ url }, 'Creating webhook');
        return this.request('POST', '/webhooks/', {
            topics: ['PRINT_JOB_STATUS_CHANGED'], // Array of topics
            url: url
        });
    }

    // List existing webhooks
    async listWebhooks(): Promise<any[]> {
        const response = await this.request<{ results: any[] }>('GET', '/webhooks/');
        return response.results || [];
    }

    // Delete a webhook
    async deleteWebhook(id: string): Promise<void> {
        await this.request('DELETE', `/webhooks/${id}/`);
    }

    // --- Validation Methods (Pre-flight) ---

    // Validate Interior PDF
    async validateInterior(url: string, podPackageId: string): Promise<string> {
        logger.info({ podPackageId }, 'Validating interior');
        const response: any = await this.request('POST', '/printable-normalization/', {
            pod_package_id: podPackageId,
            source_url: url,
        });
        return response.id; // Returns validation job ID
    }

    // Validate Cover PDF
    async validateCover(url: string, podPackageId: string, pageCount: number): Promise<string> {
        logger.info({ podPackageId, pageCount }, 'Validating cover');
        const response: any = await this.request('POST', '/printable-normalization/', {
            pod_package_id: podPackageId,
            source_url: url,
            page_count: pageCount,
        });
        return response.id; // Returns validation job ID
    }

    // Poll validation status
    async pollValidationStatus(id: string, timeoutMs: number = 60000): Promise<any> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeoutMs) {
            const response: any = await this.request('GET', `/printable-normalization/${id}/`, undefined, { skipRetry: true });
            const status = response.status.name;

            logger.info({ jobId: id, status }, 'Validation job status');

            if (status === 'VALIDATED' || status === 'NORMALIZED') {
                return response;
            }

            if (status === 'ERROR') {
                // If there are specific file errors, throw them
                if (response.printable_normalization) {
                    const errors = JSON.stringify(response.printable_normalization);
                    throw new Error(`Validation Failed: ${errors}`);
                }
                throw new Error(`Validation Failed with Unknown Error. Job ID: ${id}`);
            }

            // Wait 2 seconds before retry
            await new Promise(r => setTimeout(r, 2000));
        }

        throw new Error(`Validation timed out after ${timeoutMs}ms`);
    }
}

// Cost calculation types
export interface CostCalculationOptions {
    format: 'softcover' | 'hardcover';
    size: '7.5x7.5' | '8x8' | '8x10';
    pageCount: number;
    quantity: number;
    podPackageId?: string;
    name?: string;
    street1?: string;
    street2?: string;
    phoneNumber?: string;
    countryCode?: string;
    stateCode?: string;
    postalCode?: string;
    shippingCity?: string;
    shippingOption?: ShippingLevel;
}

export interface ShippingOptionRequest {
    lineItems: Array<{
        pageCount: number;
        podPackageId: string;
        quantity: number;
    }>;
    shippingAddress: {
        name?: string;
        street1?: string;
        street2?: string;
        city: string;
        stateCode?: string;
        postalCode: string;
        countryCode: string;
        phoneNumber?: string;
    };
    currency?: string;
}

export interface ShippingOption {
    id: string;
    level: ShippingLevel;
    currency: string;
    cost_excl_tax?: string;
    min_delivery_date?: string;
    max_delivery_date?: string;
    min_dispatch_date?: string;
    max_dispatch_date?: string;
    home_only?: boolean;
    business_only?: boolean;
    postbox_ok?: boolean;
    traceable?: boolean;
}

export interface CostCalculationResult {
    productCost: number;      // cents
    shippingCost: number;     // cents
    totalWholesale: number;   // cents
    currency: string;
}

interface LuluCostResponse {
    line_item_costs?: Array<{
        cost_excl_tax?: string;
        tax_amount?: string;
        total_cost_incl_tax?: string;
    }>;
    shipping_cost?: {
        cost_excl_tax?: string;
        tax_amount?: string;
        total_cost_incl_tax?: string;
    };
    total_cost_incl_tax?: string;
    currency?: string;
}

// Module-level singleton so OAuth token cache persists across requests
let _luluClientSingleton: LuluClient | null = null;

export function createLuluClient(): LuluClient {
    if (!_luluClientSingleton) {
        const apiKey = process.env.LULU_API_KEY;
        const apiSecret = process.env.LULU_API_SECRET;
        if (!apiKey || !apiSecret) {
            throw new Error('Lulu API credentials not configured (LULU_API_KEY / LULU_API_SECRET)');
        }
        _luluClientSingleton = new LuluClient({
            apiKey,
            apiSecret,
            sandbox: process.env.LULU_SANDBOX === 'true',
        });
    }
    return _luluClientSingleton;
}

/** Reset singleton — exposed for testing only */
export function _resetLuluClient(): void {
    _luluClientSingleton = null;
}

export { LuluClient };
