// ============================================
// Checkout API Tests
// ============================================

import { NextRequest } from 'next/server';

// Mock Stripe
const mockStripeSession = {
    id: 'cs_test_xxx',
    url: 'https://checkout.stripe.com/test',
    payment_intent: 'pi_test_xxx',
};

jest.mock('@/lib/stripe/server', () => ({
    stripe: {
        checkout: {
            sessions: {
                create: jest.fn(() => Promise.resolve(mockStripeSession)),
            },
        },
    },
    calculatePrice: jest.fn(() => ({
        subtotal: 2999, // cents
        shipping: 499,
        total: 3498,
    })),
    formatPrice: jest.fn((cents: number) => `$${(cents / 100).toFixed(2)}`),
}));

// Mock Supabase
const mockSupabase = {
    auth: {
        getUser: jest.fn(),
    },
    from: jest.fn(() => mockSupabase),
    select: jest.fn(() => mockSupabase),
    insert: jest.fn(() => mockSupabase),
    eq: jest.fn(() => mockSupabase),
    single: jest.fn(),
};

jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(() => Promise.resolve(mockSupabase)),
}));

describe('Checkout API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    describe('POST /api/checkout', () => {
        const validCheckoutBody = {
            bookId: 'book-123',
            format: 'softcover',
            size: '6x6',
            quantity: 1,
            shipping: {
                fullName: 'John Doe',
                addressLine1: '123 Main St',
                city: 'New York',
                state: 'NY',
                postalCode: '10001',
                country: 'US',
                phone: '555-123-4567',
            },
        };

        it('should return 401 if not authenticated', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: new Error('Not authenticated'),
            });

            const request = new NextRequest('http://localhost:3000/api/checkout', {
                method: 'POST',
                body: JSON.stringify(validCheckoutBody),
            });

            const { POST } = await import('@/app/api/checkout/route');
            const response = await POST(request);

            expect(response.status).toBe(401);
        });

        it('should return 400 if required fields missing', async () => {
            const mockUser = { id: 'user-123', email: 'test@example.com' };
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: mockUser },
                error: null,
            });

            const request = new NextRequest('http://localhost:3000/api/checkout', {
                method: 'POST',
                body: JSON.stringify({ bookId: 'book-123' }), // Missing other fields
            });

            const { POST } = await import('@/app/api/checkout/route');
            const response = await POST(request);

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Missing required fields');
        });

        it('should return 404 if book not found', async () => {
            const mockUser = { id: 'user-123', email: 'test@example.com' };
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: mockUser },
                error: null,
            });

            mockSupabase.single.mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
            });

            const request = new NextRequest('http://localhost:3000/api/checkout', {
                method: 'POST',
                body: JSON.stringify(validCheckoutBody),
            });

            const { POST } = await import('@/app/api/checkout/route');
            const response = await POST(request);

            expect(response.status).toBe(404);
        });

        it('should create checkout session and order', async () => {
            const mockUser = { id: 'user-123', email: 'test@example.com' };
            const mockBook = {
                id: 'book-123',
                title: 'My Book',
                thumbnail_url: null,
                pages: [{ id: 'page-1' }, { id: 'page-2' }],
            };
            const mockOrder = { id: 'order-123' };

            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: mockUser },
                error: null,
            });

            mockSupabase.single
                .mockResolvedValueOnce({ data: mockBook, error: null }) // Get book
                .mockResolvedValueOnce({ data: mockOrder, error: null }); // Create order

            const request = new NextRequest('http://localhost:3000/api/checkout', {
                method: 'POST',
                body: JSON.stringify(validCheckoutBody),
            });

            const { POST } = await import('@/app/api/checkout/route');
            const response = await POST(request);

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.sessionId).toBe('cs_test_xxx');
            expect(data.url).toBeDefined();
            expect(data.pricing).toBeDefined();
        });
    });
});
