/**
 * @jest-environment node
 */
// ============================================
// API Auth Guards Integration Tests
// ============================================
// Verifies that requireAuth() and requireAdmin() guards
// properly protect API routes from unauthenticated/unauthorized access

import { NextRequest } from 'next/server';

// ---- Supabase mock ----
const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

const mockSupabase = {
    auth: { getUser: mockGetUser },
    from: mockFrom,
};

// Chain helpers: from().select().eq().eq().single()
function setupChain(result: { data: unknown; error: unknown }) {
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
    // Support multiple .eq() calls by returning the chain
    mockEq.mockReturnValue({ eq: mockEq, single: mockSingle });
    mockSingle.mockResolvedValue(result);
}

jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(() => Promise.resolve(mockSupabase)),
    createAdminClient: jest.fn(() => Promise.resolve(mockSupabase)),
}));

// ---- Helpers ----
const MOCK_USER = { id: 'user-123', email: 'test@example.com' };
const MOCK_ADMIN = { id: 'admin-456', email: 'admin@example.com' };

function mockUnauthenticated() {
    mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
    });
}

function mockAuthenticated(user = MOCK_USER) {
    mockGetUser.mockResolvedValue({
        data: { user },
        error: null,
    });
}

// ============================================
// requireAuth-protected routes
// ============================================

describe('requireAuth-protected routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    describe('GET /api/orders/[orderId]', () => {
        it('should return 401 when unauthenticated', async () => {
            mockUnauthenticated();

            const { GET } = await import('@/app/api/orders/[orderId]/route');
            const req = new NextRequest('http://localhost:3000/api/orders/order-1');
            const res = await GET(req, { params: Promise.resolve({ orderId: 'order-1' }) });

            expect(res.status).toBe(401);
            const body = await res.json();
            expect(body.error).toBe('Unauthorized');
        });

        it('should add user_id ownership filter when authenticated', async () => {
            mockAuthenticated();
            setupChain({ data: null, error: { code: 'PGRST116', message: 'not found' } });

            const { GET } = await import('@/app/api/orders/[orderId]/route');
            const req = new NextRequest('http://localhost:3000/api/orders/order-1');
            await GET(req, { params: Promise.resolve({ orderId: 'order-1' }) });

            // Verify .eq was called with user_id filter
            const eqCalls = mockEq.mock.calls;
            const hasUserIdFilter = eqCalls.some(
                (call: unknown[]) => call[0] === 'user_id' && call[1] === MOCK_USER.id
            );
            expect(hasUserIdFilter).toBe(true);
        });
    });

    describe('GET /api/orders/session/[sessionId]', () => {
        it('should return 401 when unauthenticated', async () => {
            mockUnauthenticated();

            const { GET } = await import('@/app/api/orders/session/[sessionId]/route');
            const req = new NextRequest('http://localhost:3000/api/orders/session/cs_test_123');
            const res = await GET(req, { params: Promise.resolve({ sessionId: 'cs_test_123' }) });

            expect(res.status).toBe(401);
            const body = await res.json();
            expect(body.error).toBe('Unauthorized');
        });

        it('should add user_id ownership filter when authenticated', async () => {
            mockAuthenticated();
            setupChain({ data: null, error: { code: 'PGRST116', message: 'not found' } });

            const { GET } = await import('@/app/api/orders/session/[sessionId]/route');
            const req = new NextRequest('http://localhost:3000/api/orders/session/cs_test_123');
            await GET(req, { params: Promise.resolve({ sessionId: 'cs_test_123' }) });

            const eqCalls = mockEq.mock.calls;
            const hasUserIdFilter = eqCalls.some(
                (call: unknown[]) => call[0] === 'user_id' && call[1] === MOCK_USER.id
            );
            expect(hasUserIdFilter).toBe(true);
        });
    });

    describe('POST /api/lulu/calculate-cost', () => {
        it('should return 401 when unauthenticated', async () => {
            mockUnauthenticated();

            const { POST } = await import('@/app/api/lulu/calculate-cost/route');
            const req = new NextRequest('http://localhost:3000/api/lulu/calculate-cost', {
                method: 'POST',
                body: JSON.stringify({ format: 'softcover', size: '6x9', pageCount: 24, quantity: 1 }),
            });
            const res = await POST(req);

            expect(res.status).toBe(401);
            const body = await res.json();
            expect(body.error).toBe('Unauthorized');
        });
    });

    describe('POST /api/lulu/shipping-options', () => {
        it('should return 401 when unauthenticated', async () => {
            mockUnauthenticated();

            const { POST } = await import('@/app/api/lulu/shipping-options/route');
            const req = new NextRequest('http://localhost:3000/api/lulu/shipping-options', {
                method: 'POST',
                body: JSON.stringify({ format: 'softcover', size: '6x9', pageCount: 24 }),
            });
            const res = await POST(req);

            expect(res.status).toBe(401);
            const body = await res.json();
            expect(body.error).toBe('Unauthorized');
        });
    });
});

// ============================================
// requireAdmin-protected routes
// ============================================

describe('requireAdmin-protected routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    describe('POST /api/fulfillment/trigger', () => {
        it('should return 401 when unauthenticated', async () => {
            mockUnauthenticated();

            const { POST } = await import('@/app/api/fulfillment/trigger/route');
            const req = new NextRequest('http://localhost:3000/api/fulfillment/trigger', {
                method: 'POST',
                body: JSON.stringify({ orderId: 'order-1' }),
            });
            const res = await POST(req);

            expect(res.status).toBe(401);
            const body = await res.json();
            expect(body.error).toBe('Unauthorized');
        });

        it('should return 403 when user is not admin', async () => {
            mockAuthenticated();
            setupChain({ data: { is_admin: false }, error: null });

            const { POST } = await import('@/app/api/fulfillment/trigger/route');
            const req = new NextRequest('http://localhost:3000/api/fulfillment/trigger', {
                method: 'POST',
                body: JSON.stringify({ orderId: 'order-1' }),
            });
            const res = await POST(req);

            expect(res.status).toBe(403);
            const body = await res.json();
            expect(body.error).toBe('Forbidden');
        });
    });
});

// ============================================
// requireAuth and requireAdmin unit tests
// ============================================

describe('api-guard helpers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    describe('requireAuth()', () => {
        it('should return user and supabase client on success', async () => {
            mockAuthenticated();

            const { requireAuth } = await import('@/lib/auth/api-guard');
            const result = await requireAuth();

            expect(result.error).toBeNull();
            expect(result.user).toEqual(MOCK_USER);
            expect(result.supabase).not.toBeNull();
        });

        it('should return 401 response on auth failure', async () => {
            mockUnauthenticated();

            const { requireAuth } = await import('@/lib/auth/api-guard');
            const result = await requireAuth();

            expect(result.user).toBeNull();
            expect(result.supabase).toBeNull();
            expect(result.error).not.toBeNull();
            expect(result.error!.status).toBe(401);
        });
    });

    describe('requireAdmin()', () => {
        it('should return user on success for admin', async () => {
            mockAuthenticated(MOCK_ADMIN);
            setupChain({ data: { is_admin: true }, error: null });

            const { requireAdmin } = await import('@/lib/auth/api-guard');
            const result = await requireAdmin();

            expect(result.error).toBeNull();
            expect(result.user).toEqual(MOCK_ADMIN);
        });

        it('should return 401 when not authenticated', async () => {
            mockUnauthenticated();

            const { requireAdmin } = await import('@/lib/auth/api-guard');
            const result = await requireAdmin();

            expect(result.error!.status).toBe(401);
        });

        it('should return 403 when user is not admin', async () => {
            mockAuthenticated();
            setupChain({ data: { is_admin: false }, error: null });

            const { requireAdmin } = await import('@/lib/auth/api-guard');
            const result = await requireAdmin();

            expect(result.error!.status).toBe(403);
        });

        it('should return 500 when profile lookup fails', async () => {
            mockAuthenticated();
            setupChain({ data: null, error: { message: 'DB error' } });

            const { requireAdmin } = await import('@/lib/auth/api-guard');
            const result = await requireAdmin();

            expect(result.error!.status).toBe(500);
        });
    });
});
