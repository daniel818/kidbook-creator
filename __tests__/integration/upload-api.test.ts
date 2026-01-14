// ============================================
// Upload API Tests
// ============================================

import { NextRequest } from 'next/server';

// Mock Supabase
const mockSupabase = {
    auth: {
        getUser: jest.fn(),
    },
    storage: {
        from: jest.fn(() => ({
            upload: jest.fn(),
            createSignedUrl: jest.fn(),
            remove: jest.fn(),
        })),
    },
};

jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(() => Promise.resolve(mockSupabase)),
}));

describe('Upload API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    describe('POST /api/upload', () => {
        it('should return 401 if not authenticated', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: new Error('Not authenticated'),
            });

            const formData = new FormData();
            formData.append('file', new Blob(['test'], { type: 'image/jpeg' }), 'test.jpg');

            const request = new NextRequest('http://localhost:3000/api/upload', {
                method: 'POST',
                body: formData,
            });

            const { POST } = await import('@/app/api/upload/route');
            const response = await POST(request);

            expect(response.status).toBe(401);
        });

        it('should return 400 if no file provided', async () => {
            const mockUser = { id: 'user-123', email: 'test@example.com' };
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: mockUser },
                error: null,
            });

            const formData = new FormData();
            const request = new NextRequest('http://localhost:3000/api/upload', {
                method: 'POST',
                body: formData,
            });

            const { POST } = await import('@/app/api/upload/route');
            const response = await POST(request);

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('No file provided');
        });

        it('should return 400 for invalid file type', async () => {
            const mockUser = { id: 'user-123', email: 'test@example.com' };
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: mockUser },
                error: null,
            });

            const formData = new FormData();
            formData.append('file', new Blob(['test'], { type: 'text/plain' }), 'test.txt');

            const request = new NextRequest('http://localhost:3000/api/upload', {
                method: 'POST',
                body: formData,
            });

            const { POST } = await import('@/app/api/upload/route');
            const response = await POST(request);

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toContain('Invalid file type');
        });
    });

    describe('DELETE /api/upload', () => {
        it('should return 403 when trying to delete another user\'s file', async () => {
            const mockUser = { id: 'user-123', email: 'test@example.com' };
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: mockUser },
                error: null,
            });

            const request = new NextRequest('http://localhost:3000/api/upload', {
                method: 'DELETE',
                body: JSON.stringify({ path: 'other-user-456/book/image.jpg' }),
            });

            const { DELETE } = await import('@/app/api/upload/route');
            const response = await DELETE(request);

            expect(response.status).toBe(403);
            const data = await response.json();
            expect(data.error).toBe('Forbidden');
        });
    });
});
