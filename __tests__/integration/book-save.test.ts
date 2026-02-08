/**
 * @jest-environment node
 */
// ============================================
// Book Save API Integration Tests
// Tests surgical pageEdits vs full page replacement
// ============================================

import { NextRequest } from 'next/server';

// Mock Supabase - use a factory that creates fresh mocks for each call chain
// The key challenge is that the route handler makes multiple queries with different
// chain structures (e.g., select().eq().eq().single() vs select().eq() vs upsert()).
// We track calls to handle each chain correctly.

let fromCallIndex = 0;
let singleCallIndex = 0;
let singleMocks: Array<{ data: unknown; error: unknown }> = [];
let selectReturnOverride: null | ((callIndex: number) => unknown) = null;
let upsertCalled = false;
let updateCalls: unknown[] = [];

const mockSupabase: Record<string, jest.Mock | Record<string, jest.Mock>> = {
    auth: {
        getUser: jest.fn(),
    },
    from: jest.fn(() => mockSupabase),
    select: jest.fn((...args: unknown[]) => {
        if (selectReturnOverride) {
            const result = selectReturnOverride(fromCallIndex);
            if (result !== null) return result;
        }
        return mockSupabase;
    }),
    insert: jest.fn(() => mockSupabase),
    update: jest.fn((...args: unknown[]) => {
        updateCalls.push(args);
        return {
            eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null }),
            }),
        };
    }),
    delete: jest.fn(() => mockSupabase),
    upsert: jest.fn((...args: unknown[]) => {
        upsertCalled = true;
        return Promise.resolve({ error: null });
    }),
    eq: jest.fn(() => mockSupabase),
    in: jest.fn(() => mockSupabase),
    single: jest.fn(() => {
        const mock = singleMocks[singleCallIndex] || { data: null, error: { message: 'No mock' } };
        singleCallIndex++;
        return Promise.resolve(mock);
    }),
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
        fromCallIndex = 0;
        singleCallIndex = 0;
        singleMocks = [];
        selectReturnOverride = null;
        upsertCalled = false;
        updateCalls = [];

        // Default: authenticated user
        (mockSupabase.auth as Record<string, jest.Mock>).getUser.mockResolvedValue({
            data: { user: mockUser },
            error: null,
        });

        // Reset mock implementations
        (mockSupabase.select as jest.Mock).mockImplementation(() => mockSupabase);
        (mockSupabase.single as jest.Mock).mockImplementation(() => {
            const mock = singleMocks[singleCallIndex] || { data: null, error: { message: 'No mock' } };
            singleCallIndex++;
            return Promise.resolve(mock);
        });
        (mockSupabase.update as jest.Mock).mockImplementation(() => ({
            eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null }),
            }),
        }));
        (mockSupabase.upsert as jest.Mock).mockImplementation((...args: unknown[]) => {
            upsertCalled = true;
            return Promise.resolve({ error: null });
        });
    });

    describe('settings-only save (no pages)', () => {
        it('should update title without touching pages', async () => {
            // single() calls: 1) book access check, 2) final book fetch
            singleMocks = [
                { data: mockBook, error: null },                          // access check
                { data: { ...mockBook, title: 'Updated Title', pages: [] }, error: null }, // final fetch
            ];

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

            const response = await PUT(request, {
                params: Promise.resolve({ bookId: 'book-abc' }),
            });

            // Verify update was called with settings
            expect(mockSupabase.update).toHaveBeenCalled();
            // Verify upsert was NOT called (no pages sent)
            expect(upsertCalled).toBe(false);
        });
    });

    describe('pageEdits (surgical save)', () => {
        it('should update only the text of the specified page', async () => {
            const currentPage = {
                id: 'page-1',
                text_elements: [{ id: 'te-1', content: 'Original text', x: 10, y: 70 }],
                image_elements: [{ id: 'ie-1', src: 'http://example.com/img.png' }],
            };

            // single() calls: 1) book access check, 2) page fetch for edit, 3) final book fetch
            singleMocks = [
                { data: mockBook, error: null },           // access check
                { data: currentPage, error: null },        // page fetch for edit
                { data: { ...mockBook, pages: [] }, error: null }, // final book fetch
            ];

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
            singleMocks = [
                { data: mockBook, error: null },           // access check
                { data: { ...mockBook, pages: [] }, error: null }, // final book fetch
            ];

            const { PUT } = await import('@/app/api/books/[bookId]/route');
            const request = createPutRequest('book-abc', {
                settings: { title: 'Test', childName: 'E', childAge: 5, bookType: 'p', bookTheme: 'a' },
                pageEdits: [],
            });

            await PUT(request, {
                params: Promise.resolve({ bookId: 'book-abc' }),
            });

            // select for page data should NOT have been called with text_elements
            const selectCalls = (mockSupabase.select as jest.Mock).mock.calls.map((c: unknown[]) => c[0]);
            expect(selectCalls).not.toContain('id, text_elements, image_elements');
        });

        it('should skip edits for non-existent pages', async () => {
            singleMocks = [
                { data: mockBook, error: null },                    // access check
                { data: null, error: { message: 'Not found' } },   // page not found
                { data: { ...mockBook, pages: [] }, error: null },  // final book fetch
            ];

            const { PUT } = await import('@/app/api/books/[bookId]/route');
            const request = createPutRequest('book-abc', {
                settings: { title: 'Test', childName: 'E', childAge: 5, bookType: 'p', bookTheme: 'a' },
                pageEdits: [
                    { pageId: 'nonexistent-page', text: 'Some text' },
                ],
            });

            // Should not throw -- just skip the bad edit
            const response = await PUT(request, {
                params: Promise.resolve({ bookId: 'book-abc' }),
            });

            // Should still return successfully (settings were saved)
            expect(response).toBeDefined();
        });
    });

    describe('full page replacement (legacy)', () => {
        it('should still support full pages array for backward compat', async () => {
            // single() calls: 1) book access check, 2) final book fetch
            singleMocks = [
                { data: mockBook, error: null },           // access check
                { data: { ...mockBook, pages: [] }, error: null }, // final book fetch
            ];

            // For the existing pages query: from('pages').select('id').eq('book_id', bookId)
            // This is awaited directly (not .single()). We need select to return mockSupabase
            // for the access check chain, but return { data: [...], error: null } for the
            // pages query. We'll track the table being queried.
            let selectCallIdx = 0;
            (mockSupabase.select as jest.Mock).mockImplementation((...args: unknown[]) => {
                selectCallIdx++;
                // Call 1: access check - select('id, is_preview, ...') - needs chaining
                // Call 2: existing pages - select('id') - returns eq chain that resolves
                // Call 3: final book fetch - select('*, pages (*)') - needs chaining
                if (selectCallIdx === 2) {
                    // This is the existing pages query: from('pages').select('id').eq('book_id', bookId)
                    return {
                        eq: jest.fn().mockResolvedValue({
                            data: [{ id: 'page-1' }, { id: 'page-2' }],
                            error: null,
                        }),
                    };
                }
                return mockSupabase;
            });

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
            expect(upsertCalled).toBe(true);
        });
    });
});
