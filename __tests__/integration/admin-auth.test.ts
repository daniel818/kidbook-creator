// ============================================
// Admin Authorization Tests
// ============================================

import { NextRequest } from 'next/server';

// Mock Supabase
const mockSupabase = {
    auth: {
        getUser: jest.fn(),
    },
    from: jest.fn(() => mockSupabase),
    select: jest.fn(() => mockSupabase),
    eq: jest.fn(() => mockSupabase),
    single: jest.fn(),
    order: jest.fn(() => mockSupabase),
    range: jest.fn(),
};

jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(() => Promise.resolve(mockSupabase)),
}));

describe('Admin Authorization', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset module cache to ensure fresh imports
        jest.resetModules();
    });

    describe('GET /api/admin/stats', () => {
        it('should return 401 if not authenticated', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: new Error('Not authenticated'),
            });

            const { GET } = await import('@/app/api/admin/stats/route');
            const response = await GET();

            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data.error).toBe('Unauthorized');
        });

        it('should return 403 if user is not admin', async () => {
            const mockUser = { id: 'user-123', email: 'test@example.com' };

            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: mockUser },
                error: null,
            });

            mockSupabase.single.mockResolvedValue({
                data: { is_admin: false },
                error: null,
            });

            const { GET } = await import('@/app/api/admin/stats/route');
            const response = await GET();

            expect(response.status).toBe(403);
            const data = await response.json();
            expect(data.error).toBe('Forbidden');
        });

        it('should return stats if user is admin', async () => {
            const mockUser = { id: 'admin-123', email: 'admin@example.com' };

            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: mockUser },
                error: null,
            });

            // Mock profile check
            mockSupabase.single.mockResolvedValueOnce({
                data: { is_admin: true },
                error: null,
            });

            // Mock orders/users/books queries
            mockSupabase.select.mockResolvedValue({ data: [], error: null });

            const { GET } = await import('@/app/api/admin/stats/route');
            const response = await GET();

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('totalOrders');
            expect(data).toHaveProperty('totalRevenue');
        });
    });

    describe('GET /api/admin/orders', () => {
        it('should return 403 for non-admin', async () => {
            const mockUser = { id: 'user-123', email: 'test@example.com' };

            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: mockUser },
                error: null,
            });

            mockSupabase.single.mockResolvedValue({
                data: { is_admin: false },
                error: null,
            });

            const request = new NextRequest('http://localhost:3000/api/admin/orders');
            const { GET } = await import('@/app/api/admin/orders/route');
            const response = await GET(request);

            expect(response.status).toBe(403);
        });

        it('should return orders for admin', async () => {
            const mockUser = { id: 'admin-123', email: 'admin@example.com' };
            const mockOrders = [
                { id: 'order-1', status: 'paid', total: 29.99 },
                { id: 'order-2', status: 'shipped', total: 39.99 },
            ];

            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: mockUser },
                error: null,
            });

            mockSupabase.single.mockResolvedValueOnce({
                data: { is_admin: true },
                error: null,
            });

            mockSupabase.range.mockResolvedValue({
                data: mockOrders,
                error: null,
                count: 2,
            });

            const request = new NextRequest('http://localhost:3000/api/admin/orders');
            const { GET } = await import('@/app/api/admin/orders/route');
            const response = await GET(request);

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.orders).toBeDefined();
        });
    });
});
