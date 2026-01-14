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
    printableId: string;  // ID of the uploaded print file
    quantity: number;
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

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
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

        // Upload the actual file
        await fetch(createResponse.upload_url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/pdf',
            },
            body: file,
        });

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
                quantity: item.quantity,
                pod_package_id: item.productSpec.podPackageId,
            })),
            shipping_address: {
                name: job.shippingAddress.name,
                street1: job.shippingAddress.streetAddress,
                street2: job.shippingAddress.streetAddress2,
                city: job.shippingAddress.city,
                state_code: job.shippingAddress.stateCode,
                postal_code: job.shippingAddress.postalCode,
                country_code: job.shippingAddress.countryCode,
                phone_number: job.shippingAddress.phoneNumber,
            },
            shipping_level: 'MAIL',  // Options: MAIL, PRIORITY_MAIL, GROUND, EXPEDITED, EXPRESS
        };

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
