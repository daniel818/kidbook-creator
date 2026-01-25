// ============================================
// Lulu API Client
// ============================================
// Print-on-demand integration for book printing

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
// These are example IDs - actual IDs would come from Lulu's product catalog
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

        // Request new token
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
            throw new Error(`Failed to authenticate with Lulu: ${response.statusText}`);
        }

        const data = await response.json();
        this.accessToken = data.access_token;
        this.tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000);

        return this.accessToken!;
    }

    private async request<T>(
        method: string,
        endpoint: string,
        body?: unknown
    ): Promise<T> {
        const token = await this.getAccessToken();
        const url = `${this.baseUrl}${endpoint}`;

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
            throw new Error(`Lulu API error: ${response.status} - ${error}`);
        }

        return response.json();
    }

    // Upload a print-ready file
    async uploadPrintFile(file: Blob, filename: string): Promise<string> {
        // Create the print file
        const createResponse = await this.request<{ id: string; upload_url: string }>(
            'POST',
            '/print-files/',
            { name: filename }
        );

        console.log(`[Lulu] Uploading file ${filename} (Size: ${file.size}) to ${createResponse.upload_url}`);

        // Convert Blob to ArrayBuffer for reliable Node fetch upload
        const arrayBuffer = await file.arrayBuffer();

        // Upload the actual file
        const uploadRes = await fetch(createResponse.upload_url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/pdf',
            },
            body: arrayBuffer,
        });

        if (!uploadRes.ok) {
            const errText = await uploadRes.text();
            console.error(`[Lulu] Upload PUT failed: ${uploadRes.status} - ${errText}`);
            throw new Error(`Failed to upload file content: ${uploadRes.status}`);
        }

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
            shipping_level: 'MAIL',  // Options: MAIL, PRIORITY_MAIL, GROUND, EXPEDITED, EXPRESS
        };

        console.log('[LuluClient] Creating Print Job Payload:', JSON.stringify(payload, null, 2));
        return this.request('POST', '/print-jobs/', payload);
    }

    // Get print job status
    async getPrintJob(printJobId: string): Promise<LuluOrder> {
        return this.request('GET', `/print-jobs/${printJobId}/`);
    }

    // Cancel a print job
    async cancelPrintJob(printJobId: string): Promise<void> {
        await this.request('POST', `/print-jobs/${printJobId}/cancel/`);
    }

    // Get product ID for book format
    static getProductId(format: 'softcover' | 'hardcover', size: '6x6' | '8x8' | '8x10'): string {
        return PRODUCT_IDS[format][size];
    }

    // Calculate print job cost without creating an order
    async calculateCost(options: CostCalculationOptions): Promise<CostCalculationResult> {
        const podPackageId = PRODUCT_IDS[options.format]?.[options.size];
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
                city: options.shippingCity || 'New York',
                country_code: options.countryCode || 'US',
                postal_code: options.postalCode || '10001',
                state_code: options.stateCode || 'NY',
            },
            shipping_level: options.shippingLevel || 'MAIL',
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
    // Create a webhook subscription
    async createWebhook(url: string): Promise<any> {
        console.log(`[LuluClient] Creating webhook for URL: ${url}`);
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
        console.log(`[Lulu] Validating Interior: ${podPackageId}`);
        const response: any = await this.request('POST', '/printable-normalization/', {
            pod_package_id: podPackageId,
            source_url: url,
        });
        return response.id; // Returns validation job ID
    }

    // Validate Cover PDF
    async validateCover(url: string, podPackageId: string, pageCount: number): Promise<string> {
        console.log(`[Lulu] Validating Cover: ${podPackageId} (${pageCount} pages)`);
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
            const response: any = await this.request('GET', `/printable-normalization/${id}/`);
            const status = response.status.name;

            console.log(`[Lulu] Validation Job ${id}: ${status}`);

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
    size: '6x6' | '8x8' | '8x10';
    pageCount: number;
    quantity: number;
    countryCode?: string;
    stateCode?: string;
    postalCode?: string;
    shippingCity?: string;
    shippingLevel?: 'MAIL' | 'PRIORITY_MAIL' | 'GROUND' | 'EXPEDITED' | 'EXPRESS';
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

// Factory function to create client
export function createLuluClient(): LuluClient {
    return new LuluClient({
        apiKey: process.env.LULU_API_KEY!,
        apiSecret: process.env.LULU_API_SECRET!,
        sandbox: process.env.LULU_SANDBOX === 'true',
    });
}

export { LuluClient };
