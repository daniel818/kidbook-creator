// ============================================
// Book Save API Integration Tests
// Tests surgical pageEdits vs full page replacement
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

// Helpers
const mockUser = { id: 'user-123', email: 'test@example.com' };

const mockBook = {
    id: 'book-abc',
    is_preview: false,
    status: 'draft',
    digital_unlock_paid: true,
    user_id: 'user-123',
};

function createPutRequest(bookId: string, body: Record<string, unknown>) {
    return new NextRequest(`http://localhost:3000/api/books/${bookId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    });
}

describe('Book Save API - PUT /api/books/[bookId]', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default: authenticated user
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: mockUser },
            error: null,
        });
        // Default: book exists and is accessible
        mockSupabase.single.mockResolvedValue({
            data: mockBook,
            error: null,
        });
        // Default: update succeeds
        mockSupabase.update.mockReturnValue({
            eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null }),
            }),
        });
    });

    describe('settings-only save (no pages)', () => {
        it('should update title without touching pages', async () => {
            const { PUT } = await import('@/app/api/books/[bookId]/route');
            const request = createPutRequest('book-abc', {
                settings: {
                    title: 'Updated Title',
                    childName: 'Emma',
                    childAge: 5,
                    bookType: 'picture',
                    bookTheme: 'adventure',
                },
            });

            // Mock the final book fetch
            mockSupabase.single.mockResolvedValueOnce({
                data: mockBook,
                error: null,
            }).mockResolvedValueOnce({
                data: { ...mockBook, title: 'Updated Title' },
                error: null,
            });

            const response = await PUT(request, {
                params: Promise.resolve({ bookId: 'book-abc' }),
            });

            // Verify update was called with settings
            expect(mockSupabase.update).toHaveBeenCalled();
            // Verify upsert was NOT called (no pages sent)
            expect(mockSupabase.upsert).not.toHaveBeenCalled();
        });
    });

    describe('pageEdits (surgical save)', () => {
        it('should update only the text of the specified page', async () => {
            // Mock: fetch current page from DB
            const currentPage = {
                id: 'page-1',
                text_elements: [{ id: 'te-1', content: 'Original text', x: 10, y: 70 }],
                image_elements: [{ id: 'ie-1', src: 'http://example.com/img.png' }],
            };

            // Reset single mock for this test
            mockSupabase.single
                .mockResolvedValueOnce({ data: mockBook, error: null })   // book access check
                .mockResolvedValueOnce({ data: currentPage, error: null }); // page fetch

            // Mock update chain
            const updateEq2 = jest.fn().mockResolvedValue({ error: null });
            const updateEq1 = jest.fn().mockReturnValue({ eq: updateEq2 });
            mockSupabase.update
                .mockReturnValueOnce({ eq: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }) }) // settings update
                .mockReturnValueOnce({ eq: updateEq1 }); // page update

            const { PUT } = await import('@/app/api/books/[bookId]/route');
            const request = createPutRequest('book-abc', {
                settings: { title: 'Test', childName: 'E', childAge: 5, bookType: 'p', bookTheme: 'a' },
                pageEdits: [
                    { pageId: 'page-1', text: 'New paragraph one.\n\nNew paragraph two.' },
                ],
            });

            await PUT(request, {
                params: Promise.resolve({ bookId: 'book-abc' }),
            });

            // Verify page was fetched from DB
            expect(mockSupabase.from).toHaveBeenCalledWith('pages');
            expect(mockSupabase.select).toHaveBeenCalledWith('id, text_elements, image_elements');
        });

        it('should not update pages when pageEdits is empty', async () => {
            mockSupabase.single.mockResolvedValueOnce({
                data: mockBook,
                error: null,
            });

            mockSupabase.update.mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ error: null }),
                }),
            });

            const { PUT } = await import('@/app/api/books/[bookId]/route');
            const request = createPutRequest('book-abc', {
                settings: { title: 'Test', childName: 'E', childAge: 5, bookType: 'p', bookTheme: 'a' },
                pageEdits: [],
            });

            await PUT(request, {
                params: Promise.resolve({ bookId: 'book-abc' }),
            });

            // select for page data should NOT have been called with text_elements
            const selectCalls = mockSupabase.select.mock.calls.map((c: unknown[]) => c[0]);
            expect(selectCalls).not.toContain('id, text_elements, image_elements');
        });

        it('should skip edits for non-existent pages', async () => {
            mockSupabase.single
                .mockResolvedValueOnce({ data: mockBook, error: null })   // book access
                .mockResolvedValueOnce({ data: null, error: { message: 'Not found' } }); // page not found

            mockSupabase.update.mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ error: null }),
                }),
            });

            const { PUT } = await import('@/app/api/books/[bookId]/route');
            const request = createPutRequest('book-abc', {
                settings: { title: 'Test', childName: 'E', childAge: 5, bookType: 'p', bookTheme: 'a' },
                pageEdits: [
                    { pageId: 'nonexistent-page', text: 'Some text' },
                ],
            });

            // Should not throw — just skip the bad edit
            const response = await PUT(request, {
                params: Promise.resolve({ bookId: 'book-abc' }),
            });

            // Should still return successfully (settings were saved)
            expect(response).toBeDefined();
        });
    });

    describe('full page replacement (legacy)', () => {
        it('should still support full pages array for backward compat', async () => {
            mockSupabase.single.mockResolvedValueOnce({
                data: mockBook,
                error: null,
            });

            // Mock for existing pages fetch
            mockSupabase.select.mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                    data: [{ id: 'page-1' }, { id: 'page-2' }],
                    error: null,
                }),
            });

            mockSupabase.update.mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ error: null }),
                }),
            });

            mockSupabase.upsert.mockResolvedValue({ error: null });

            const { PUT } = await import('@/app/api/books/[bookId]/route');
            const request = createPutRequest('book-abc', {
                settings: { title: 'Test', childName: 'E', childAge: 5, bookType: 'p', bookTheme: 'a' },
                pages: [
                    {
                        id: 'page-1',
                        pageNumber: 1,
                        type: 'inside',
                        backgroundColor: '#fff',
                        textElements: [{ content: 'text' }],
                        imageElements: [{ src: 'img.png' }],
                    },
                ],
            });

            await PUT(request, {
                params: Promise.resolve({ bookId: 'book-abc' }),
            });

            // Verify upsert was called (legacy path)
            expect(mockSupabase.upsert).toHaveBeenCalled();
        });
    });
});
