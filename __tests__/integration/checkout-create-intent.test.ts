/**
 * @jest-environment node
 */
// ============================================
// Create Intent API Tests
// ============================================

import { NextRequest } from 'next/server';

// Mock Stripe PaymentIntent
const mockPaymentIntent = {
    id: 'pi_test_xxx',
    client_secret: 'pi_test_xxx_secret_xxx',
    status: 'requires_payment_method',
};

jest.mock('@/lib/stripe/server', () => ({
    stripe: {
        paymentIntents: {
            create: jest.fn(() => Promise.resolve(mockPaymentIntent)),
            cancel: jest.fn(() => Promise.resolve({})),
        },
    },
    formatPrice: jest.fn((cents: number) => `$${(cents / 100).toFixed(2)}`),
}));

// Mock Lulu pricing
jest.mock('@/lib/lulu/pricing', () => ({
    calculateRetailPricing: jest.fn(() => Promise.resolve({
        subtotal: 2999,
        shipping: 499,
        total: 3498,
    })),
}));

// Mock page count
jest.mock('@/lib/lulu/page-count', () => ({
    getPrintableInteriorPageCount: jest.fn(() => 24),
}));

// Mock Supabase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSupabase: any = {
    auth: {
        getUser: jest.fn(),
    },
    from: jest.fn(() => mockSupabase),
    select: jest.fn(() => mockSupabase),
    insert: jest.fn(() => mockSupabase),
    update: jest.fn(() => mockSupabase),
    delete: jest.fn(() => mockSupabase),
    eq: jest.fn(() => mockSupabase),
    single: jest.fn(),
};

jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(() => Promise.resolve(mockSupabase)),
    createAdminClient: jest.fn(() => Promise.resolve(mockSupabase)),
}));

describe('Create Intent API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    // Valid UUID for bookId (Zod requires uuid format)
    const validBookId = '550e8400-e29b-41d4-a716-446655440000';

    const validBody = {
        bookId: validBookId,
        format: 'softcover',
        size: '8x8',
        quantity: 1,
        shipping: {
            fullName: 'Jane Doe',
            addressLine1: '456 Oak Ave',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94102',
            country: 'US',
            phone: '555-987-6543',
        },
        shippingLevel: 'MAIL',
    };

    it('should return 401 if not authenticated', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: null },
            error: new Error('Not authenticated'),
        });

        const request = new NextRequest('http://localhost:3000/api/checkout/create-intent', {
            method: 'POST',
            body: JSON.stringify(validBody),
        });

        const { POST } = await import('@/app/api/checkout/create-intent/route');
        const response = await POST(request);

        expect(response.status).toBe(401);
    });

    it('should return 400 if required fields missing', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: { id: 'user-123', email: 'test@example.com' } },
            error: null,
        });

        const request = new NextRequest('http://localhost:3000/api/checkout/create-intent', {
            method: 'POST',
            body: JSON.stringify({ bookId: validBookId }),
        });

        const { POST } = await import('@/app/api/checkout/create-intent/route');
        const response = await POST(request);

        expect(response.status).toBe(400);
        const data = await response.json();
        // Zod validation returns field-specific error messages, not 'Missing required fields'
        expect(data.error).toBeDefined();
        expect(typeof data.error).toBe('string');
        expect(data.error.length).toBeGreaterThan(0);
    });

    it('should create PaymentIntent and return clientSecret', async () => {
        const mockUser = { id: 'user-123', email: 'test@example.com' };
        const mockBook = {
            id: validBookId,
            title: 'My Book',
            is_preview: false,
            status: 'completed',
            pages: [{ id: 'page-1' }, { id: 'page-2' }],
        };
        const mockOrder = { id: 'order-123' };

        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: mockUser },
            error: null,
        });

        mockSupabase.single
            .mockResolvedValueOnce({ data: mockBook, error: null })  // Get book
            .mockResolvedValueOnce({ data: mockOrder, error: null }); // Create order

        // For the update call (linking PI to order)
        mockSupabase.update.mockReturnValue(mockSupabase);

        const request = new NextRequest('http://localhost:3000/api/checkout/create-intent', {
            method: 'POST',
            body: JSON.stringify(validBody),
        });

        const { POST } = await import('@/app/api/checkout/create-intent/route');
        const response = await POST(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.clientSecret).toBe('pi_test_xxx_secret_xxx');
        expect(data.orderId).toBe('order-123');
        expect(data.paymentIntentId).toBe('pi_test_xxx');
        expect(data.pricing).toBeDefined();
    });
});
