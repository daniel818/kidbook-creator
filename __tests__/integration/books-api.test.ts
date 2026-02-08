/**
 * @jest-environment node
 */
// ============================================
// Books API Integration Tests
// ============================================

import { NextRequest } from 'next/server';

// Mock Supabase
const mockSupabase = {
    auth: {
        getUser: jest.fn(),
    },
    from: jest.fn(() => mockSupabase),
    select: jest.fn(() => mockSupabase),
    insert: jest.fn(() => mockSupabase),
    update: jest.fn(() => mockSupabase),
    delete: jest.fn(() => mockSupabase),
    upsert: jest.fn(() => mockSupabase),
    eq: jest.fn(() => mockSupabase),
    in: jest.fn(() => mockSupabase),
    single: jest.fn(() => mockSupabase),
    order: jest.fn(() => mockSupabase),
};

jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(() => Promise.resolve(mockSupabase)),
}));

describe('Books API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/books', () => {
        it('should return 401 if not authenticated', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: new Error('Not authenticated'),
            });

            const { GET } = await import('@/app/api/books/route');
            const response = await GET();

            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data.error).toBe('Unauthorized');
        });

        it('should return books for authenticated user', async () => {
            const mockUser = { id: 'user-123', email: 'test@example.com' };
            const mockBooks = [
                {
                    id: 'book-1',
                    title: 'My Book',
                    child_name: 'Emma',
                    child_age: 5,
                    age_group: '4-6',
                    book_type: 'picture',
                    book_theme: 'adventure',
                    status: 'draft',
                    pages: [],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
            ];

            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: mockUser },
                error: null,
            });

            mockSupabase.order.mockResolvedValue({
                data: mockBooks,
                error: null,
            });

            const { GET } = await import('@/app/api/books/route');
            const response = await GET();

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(Array.isArray(data)).toBe(true);
        });
    });

    describe('POST /api/books', () => {
        it('should create a new book', async () => {
            const mockUser = { id: 'user-123', email: 'test@example.com' };
            const mockBook = {
                id: 'book-new',
                title: 'New Book',
                child_name: 'Emma',
                child_age: 5,
                age_group: '4-6',
                book_type: 'picture',
                book_theme: 'adventure',
                status: 'draft',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            const mockPage = {
                id: 'page-1',
                page_number: 0,
                page_type: 'cover',
                background_color: '#ffffff',
                text_elements: [],
                image_elements: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: mockUser },
                error: null,
            });

            mockSupabase.single
                .mockResolvedValueOnce({ data: mockBook, error: null })
                .mockResolvedValueOnce({ data: mockPage, error: null });

            const request = new NextRequest('http://localhost:3000/api/books', {
                method: 'POST',
                body: JSON.stringify({
                    settings: {
                        title: 'New Book',
                        childName: 'Emma',
                        childAge: 5,
                        ageGroup: '4-6',
                        bookType: 'picture',
                        bookTheme: 'adventure',
                    },
                }),
            });

            const { POST } = await import('@/app/api/books/route');
            const response = await POST(request);

            expect(response.status).toBe(201);
        });

        it('should return 400 if settings missing', async () => {
            const mockUser = { id: 'user-123', email: 'test@example.com' };

            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: mockUser },
                error: null,
            });

            const request = new NextRequest('http://localhost:3000/api/books', {
                method: 'POST',
                body: JSON.stringify({}),
            });

            const { POST } = await import('@/app/api/books/route');
            const response = await POST(request);

            expect(response.status).toBe(400);
            const data = await response.json();
            // Zod validation returns field-specific error messages, not 'Book settings are required'
            expect(data.error).toBeDefined();
            expect(typeof data.error).toBe('string');
            expect(data.error.length).toBeGreaterThan(0);
        });
    });
});
