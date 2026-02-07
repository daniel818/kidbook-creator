/**
 * @jest-environment node
 */
// ============================================
// Lulu Webhook Handler Tests
// ============================================
// Uses the Node test environment so that native Request/Response/Headers
// globals are available (required by next/server).

import crypto from 'crypto';

// Mock Supabase
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockSupabase = {
    from: jest.fn(() => ({
        update: mockUpdate.mockReturnValue({
            eq: mockEq.mockResolvedValue({ error: null }),
        }),
    })),
};

jest.mock('@/lib/supabase/server', () => ({
    createAdminClient: jest.fn(() => Promise.resolve(mockSupabase)),
}));

// --- Helpers ---

const TEST_SECRET = 'test-webhook-secret-key';

/** Compute a valid HMAC-SHA256 hex signature for a given raw body. */
function sign(body: string, secret: string = TEST_SECRET): string {
    return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

/** Build a minimal valid Lulu webhook payload (as raw JSON string). */
function buildPayload(overrides: Record<string, unknown> = {}): string {
    const base = {
        id: 'print-job-123',
        status: { name: 'SHIPPED' },
        ...overrides,
    };
    return JSON.stringify(base);
}

/** Build a Request object mimicking a Lulu webhook POST. */
function buildRequest(
    body: string,
    opts: { signature?: string | null; headerName?: string } = {},
): Request {
    const { signature, headerName = 'lulu-hmac-sha256' } = opts;
    const headers = new Headers({ 'content-type': 'application/json' });
    if (signature !== null && signature !== undefined) {
        headers.set(headerName, signature);
    }
    return new Request('http://localhost:3000/api/webhooks/lulu', {
        method: 'POST',
        headers,
        body,
    });
}

// --- Tests ---

describe('Lulu Webhook Handler', () => {
    const ORIGINAL_ENV = { ...process.env };

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.LULU_WEBHOOK_SECRET = TEST_SECRET;
    });

    afterEach(() => {
        process.env = { ...ORIGINAL_ENV };
    });

    // Re-import the handler fresh for each test to pick up env changes
    async function importPOST() {
        jest.resetModules();
        const mod = await import('@/app/api/webhooks/lulu/route');
        return mod.POST;
    }

    // ========================
    // Secret configuration
    // ========================
    describe('when LULU_WEBHOOK_SECRET is not set', () => {
        it('should return 500', async () => {
            delete process.env.LULU_WEBHOOK_SECRET;
            const POST = await importPOST();

            const body = buildPayload();
            const req = buildRequest(body, { signature: sign(body) });
            const res = await POST(req);

            expect(res.status).toBe(500);
            const data = await res.json();
            expect(data.error).toBe('Webhook verification not configured');
        });
    });

    // ========================
    // Signature verification
    // ========================
    describe('signature verification', () => {
        it('should return 401 when no signature header is present', async () => {
            const POST = await importPOST();

            const body = buildPayload();
            const headers = new Headers({ 'content-type': 'application/json' });
            const req = new Request('http://localhost:3000/api/webhooks/lulu', {
                method: 'POST',
                headers,
                body,
            });
            const res = await POST(req);

            expect(res.status).toBe(401);
            const data = await res.json();
            expect(data.error).toBe('Invalid signature');
        });

        it('should return 401 when signature is invalid', async () => {
            const POST = await importPOST();

            const body = buildPayload();
            const req = buildRequest(body, { signature: 'deadbeef'.repeat(8) });
            const res = await POST(req);

            expect(res.status).toBe(401);
        });

        it('should return 401 when signature is not valid hex', async () => {
            const POST = await importPOST();

            const body = buildPayload();
            // Not valid hex — contains 'g' and 'z'
            const req = buildRequest(body, { signature: 'gg' + '0'.repeat(62) });
            const res = await POST(req);

            expect(res.status).toBe(401);
        });

        it('should accept a valid signature in Lulu-HMAC-SHA256 header', async () => {
            const POST = await importPOST();

            const body = buildPayload();
            const req = buildRequest(body, {
                signature: sign(body),
                headerName: 'Lulu-HMAC-SHA256',
            });
            const res = await POST(req);

            expect(res.status).toBe(200);
        });

        it('should accept a valid signature with sha256= prefix', async () => {
            const POST = await importPOST();

            const body = buildPayload();
            const req = buildRequest(body, {
                signature: `sha256=${sign(body)}`,
            });
            const res = await POST(req);

            expect(res.status).toBe(200);
        });

        it('should accept a valid signature with uppercase SHA256= prefix', async () => {
            const POST = await importPOST();

            const body = buildPayload();
            const req = buildRequest(body, {
                signature: `SHA256=${sign(body)}`,
            });
            const res = await POST(req);

            expect(res.status).toBe(200);
        });

        it('should accept a valid signature with uppercase hex', async () => {
            const POST = await importPOST();

            const body = buildPayload();
            const req = buildRequest(body, {
                signature: sign(body).toUpperCase(),
            });
            const res = await POST(req);

            expect(res.status).toBe(200);
        });

        it('should fall back to x-lulu-signature header', async () => {
            const POST = await importPOST();

            const body = buildPayload();
            const req = buildRequest(body, {
                signature: sign(body),
                headerName: 'x-lulu-signature',
            });
            const res = await POST(req);

            expect(res.status).toBe(200);
        });
    });

    // ========================
    // Malformed payloads
    // ========================
    describe('malformed payloads', () => {
        it('should return 400 for non-JSON body', async () => {
            const POST = await importPOST();

            const body = 'this is not json';
            const req = buildRequest(body, { signature: sign(body) });
            const res = await POST(req);

            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toBe('Invalid JSON payload');
        });

        it('should return 400 when payload.data is an array', async () => {
            const POST = await importPOST();

            const body = JSON.stringify({ data: [1, 2, 3] });
            const req = buildRequest(body, { signature: sign(body) });
            const res = await POST(req);

            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toBe('Invalid payload structure');
        });

        it('should return 200 with "Ignored" when id or status is missing', async () => {
            const POST = await importPOST();

            const body = JSON.stringify({ id: 'job-1' }); // No status
            const req = buildRequest(body, { signature: sign(body) });
            const res = await POST(req);

            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.message).toContain('Ignored');
        });

        it('should return 200 with "Ignored" when id is not a string', async () => {
            const POST = await importPOST();

            const body = JSON.stringify({ id: 12345, status: { name: 'SHIPPED' } });
            const req = buildRequest(body, { signature: sign(body) });
            const res = await POST(req);

            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.message).toContain('Ignored');
        });
    });

    // ========================
    // Successful processing
    // ========================
    describe('successful processing', () => {
        it('should update the order with correct fulfillment status', async () => {
            const POST = await importPOST();

            const body = buildPayload({ id: 'job-42', status: { name: 'IN_PRODUCTION' } });
            const req = buildRequest(body, { signature: sign(body) });
            const res = await POST(req);

            expect(res.status).toBe(200);
            expect(mockSupabase.from).toHaveBeenCalledWith('orders');
            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    fulfillment_status: 'printing',
                    lulu_status: JSON.stringify({ name: 'IN_PRODUCTION' }),
                }),
            );
            expect(mockEq).toHaveBeenCalledWith('lulu_print_job_id', 'job-42');
        });

        it('should default to "processing" for unknown statuses', async () => {
            const POST = await importPOST();

            const body = buildPayload({ status: { name: 'SOME_UNKNOWN_STATUS' } });
            const req = buildRequest(body, { signature: sign(body) });
            const res = await POST(req);

            expect(res.status).toBe(200);
            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    fulfillment_status: 'processing',
                }),
            );
        });

        it('should extract estimated delivery dates', async () => {
            const POST = await importPOST();

            const body = buildPayload({
                estimated_shipping_dates: {
                    arrival_min: '2026-03-01',
                    arrival_max: '2026-03-10',
                },
            });
            const req = buildRequest(body, { signature: sign(body) });
            const res = await POST(req);

            expect(res.status).toBe(200);
            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    estimated_delivery_min: '2026-03-01',
                    estimated_delivery_max: '2026-03-10',
                }),
            );
        });

        it('should ignore estimated_shipping_dates when it is not an object', async () => {
            const POST = await importPOST();

            const body = buildPayload({ estimated_shipping_dates: 'not-an-object' });
            const req = buildRequest(body, { signature: sign(body) });
            const res = await POST(req);

            expect(res.status).toBe(200);
            // Should NOT include delivery dates in the update
            expect(mockUpdate).toHaveBeenCalledWith(
                expect.not.objectContaining({
                    estimated_delivery_min: expect.anything(),
                }),
            );
        });

        it('should extract tracking info from line_item_statuses', async () => {
            const POST = await importPOST();

            const body = buildPayload({
                line_item_statuses: [{
                    carrier_name: 'FedEx',
                    tracking_urls: ['https://track.fedex.com/12345'],
                    tracking_id: 'TRACK-12345',
                }],
            });
            const req = buildRequest(body, { signature: sign(body) });
            const res = await POST(req);

            expect(res.status).toBe(200);
            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    carrier_name: 'FedEx',
                    tracking_url: 'https://track.fedex.com/12345',
                    tracking_number: 'TRACK-12345',
                }),
            );
        });

        it('should handle line_item_statuses that is not an array', async () => {
            const POST = await importPOST();

            const body = buildPayload({ line_item_statuses: 'not-an-array' });
            const req = buildRequest(body, { signature: sign(body) });
            const res = await POST(req);

            expect(res.status).toBe(200);
            // Should succeed without tracking info
            expect(mockUpdate).toHaveBeenCalledWith(
                expect.not.objectContaining({
                    carrier_name: expect.anything(),
                }),
            );
        });

        it('should handle nested data wrapper (body.data)', async () => {
            const POST = await importPOST();

            const innerPayload = { id: 'job-99', status: { name: 'SHIPPED' } };
            const body = JSON.stringify({ data: innerPayload });
            const req = buildRequest(body, { signature: sign(body) });
            const res = await POST(req);

            expect(res.status).toBe(200);
            expect(mockEq).toHaveBeenCalledWith('lulu_print_job_id', 'job-99');
            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    fulfillment_status: 'shipped',
                }),
            );
        });
    });

    // ========================
    // DB error handling
    // ========================
    describe('database error handling', () => {
        it('should return 500 when DB update fails', async () => {
            mockEq.mockResolvedValueOnce({ error: { message: 'connection failed' } });
            const POST = await importPOST();

            const body = buildPayload();
            const req = buildRequest(body, { signature: sign(body) });
            const res = await POST(req);

            expect(res.status).toBe(500);
            const data = await res.json();
            expect(data.error).toBe('DB Update Failed');
        });
    });
});
