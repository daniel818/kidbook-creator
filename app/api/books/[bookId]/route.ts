// ============================================
// Single Book API - GET / PUT / DELETE
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Helper function for logging with timestamps
const log = (message: string, data?: unknown) => {
    const timestamp = new Date().toISOString();
    console.log(`[API books/${timestamp}] ${message}`);
    if (data !== undefined) {
        console.log(`[API ${timestamp}] Data:`, typeof data === 'string' ? data : JSON.stringify(data, null, 2).slice(0, 300));
    }
};

interface RouteContext {
    params: Promise<{ bookId: string }>;
}

// GET /api/books/[bookId] - Get a single book with pages
export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    const requestStartTime = Date.now();
    let bookId = 'unknown';

    try {
        const params = await context.params;
        bookId = params.bookId;
        log(`=== GET /api/books/${bookId} STARTED ===`);

        log('Step 1: Creating Supabase client...');
        const supabaseStartTime = Date.now();
        const supabase = await createClient();
        log(`Supabase client created in ${Date.now() - supabaseStartTime}ms`);

        log('Step 2: Authenticating user...');
        const authStartTime = Date.now();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        log(`Authentication completed in ${Date.now() - authStartTime}ms`);

        if (authError || !user) {
            log('ERROR: Unauthorized', authError?.message);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        log(`User authenticated: ${user.id}`);

        log('Step 3: Fetching book from database...');
        const dbStartTime = Date.now();
        const { data: book, error } = await supabase
            .from('books')
            .select(`*, pages (*)`)
            .eq('id', bookId)
            .eq('user_id', user.id)
            .single();
        log(`Database query completed in ${Date.now() - dbStartTime}ms`);

        if (error || !book) {
            log('ERROR: Book not found', error?.message);
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }
        log(`Book found: "${book.title}", ${book.pages?.length || 0} pages`);

        log('Step 4: Transforming response...');
        const transformStartTime = Date.now();
        const isPreview = !!book.is_preview || book.status === 'preview';
        const previewPageCount = Number(book.preview_page_count || 0);
        const totalPageCount = Number(book.total_page_count || 0);
        const digitalUnlockPaid = !!book.digital_unlock_paid;

        const responsePages = book.pages
            .sort((a: { page_number: number }, b: { page_number: number }) => a.page_number - b.page_number)
            .map((page: {
                id: string;
                page_number: number;
                page_type: string;
                background_color: string;
                background_image?: string;
                text_elements: unknown[];
                image_elements: unknown[];
                created_at: string;
                updated_at: string;
            }) => ({
                id: page.id,
                pageNumber: page.page_number,
                type: page.page_type,
                backgroundColor: page.background_color,
                backgroundImage: page.background_image,
                textElements: page.text_elements,
                imageElements: page.image_elements,
                createdAt: new Date(page.created_at),
                updatedAt: new Date(page.updated_at),
            }));

        const maskedPages = isPreview && !digitalUnlockPaid && previewPageCount > 0
            ? responsePages.map((page) => {
                if (page.pageNumber > previewPageCount) {
                    return {
                        ...page,
                        textElements: [],
                        imageElements: [],
                    };
                }
                return page;
            })
            : responsePages;

        const response = {
            id: book.id,
            settings: {
                title: book.title,
                childName: book.child_name,
                childAge: book.child_age,
                ageGroup: book.age_group,
                bookType: book.book_type,
                bookTheme: book.book_theme,
                printFormat: book.print_format,
            },
            pages: maskedPages,
            status: book.status,
            thumbnailUrl: book.thumbnail_url,
            createdAt: new Date(book.created_at),
            updatedAt: new Date(book.updated_at),
            estimatedCost: book.estimated_cost,
            isPreview,
            previewPageCount,
            totalPageCount,
            digitalUnlockPaid,
        };
        log(`Transform completed in ${Date.now() - transformStartTime}ms`);

        const totalDuration = Date.now() - requestStartTime;
        log(`=== GET /api/books/${bookId} COMPLETE in ${totalDuration}ms ===`);

        return NextResponse.json(response);
    } catch (error) {
        const totalDuration = Date.now() - requestStartTime;
        log(`=== GET /api/books/${bookId} FAILED after ${totalDuration}ms ===`);
        console.error('[API books ERROR]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/books/[bookId] - Update a book
export async function PUT(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { bookId } = await context.params;
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { settings, pages, status } = body;

        // Validate settings if provided
        if (settings) {
            // Basic validation
            if (settings.title && typeof settings.title !== 'string') {
                return NextResponse.json({ error: 'Invalid title' }, { status: 400 });
            }
            if (settings.childAge !== undefined && (typeof settings.childAge !== 'number' || settings.childAge < 0 || settings.childAge > 18)) {
                return NextResponse.json({ error: 'Invalid child age' }, { status: 400 });
            }

            const { error: bookError } = await supabase
                .from('books')
                .update({
                    title: settings.title,
                    child_name: settings.childName,
                    child_age: settings.childAge,
                    age_group: settings.ageGroup,
                    book_type: settings.bookType,
                    book_theme: settings.bookTheme,
                    status: status || 'draft',
                })
                .eq('id', bookId)
                .eq('user_id', user.id);

            if (bookError) {
                console.error('Error updating book:', bookError);
                return NextResponse.json({ error: 'Failed to update book' }, { status: 500 });
            }
        }

        // Update pages if provided
        if (pages && Array.isArray(pages)) {
            // Validate pages array
            if (pages.length === 0) {
                return NextResponse.json({ error: 'Book must have at least one page' }, { status: 400 });
            }

            // Get existing pages
            const { data: existingPages } = await supabase
                .from('pages')
                .select('id')
                .eq('book_id', bookId);

            const existingIds = new Set<string>(existingPages?.map((p: { id: string }) => p.id) || []);
            const newIds = new Set<string>(pages.map((p: { id: string }) => p.id));

            // Delete pages that no longer exist
            const toDelete = [...existingIds].filter((id) => !newIds.has(id));
            if (toDelete.length > 0) {
                await supabase.from('pages').delete().in('id', toDelete);
            }

            // Prepare page data for upsert
            const pageUpdates = pages.map((page: {
                id: string;
                pageNumber: number;
                type: string;
                backgroundColor: string;
                backgroundImage?: string;
                textElements: unknown[];
                imageElements: unknown[];
            }) => ({
                id: page.id,
                book_id: bookId,
                page_number: page.pageNumber,
                page_type: page.type,
                background_color: page.backgroundColor,
                background_image: page.backgroundImage,
                text_elements: page.textElements,
                image_elements: page.imageElements,
            }));

            // Use upsert for atomic operation (prevents race conditions)
            const { error: pagesError } = await supabase
                .from('pages')
                .upsert(pageUpdates, { onConflict: 'id' });

            if (pagesError) {
                console.error('Error updating pages:', pagesError);
                return NextResponse.json({ error: 'Failed to update pages' }, { status: 500 });
            }
        }

        // Return updated book
        const { data: updatedBook } = await supabase
            .from('books')
            .select(`*, pages (*)`)
            .eq('id', bookId)
            .single();

        if (!updatedBook) {
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }

        return NextResponse.json({
            id: updatedBook.id,
            settings: {
                title: updatedBook.title,
                childName: updatedBook.child_name,
                childAge: updatedBook.child_age,
                ageGroup: updatedBook.age_group,
                bookType: updatedBook.book_type,
                bookTheme: updatedBook.book_theme,
                printFormat: updatedBook.print_format,
            },
            pages: updatedBook.pages
                .sort((a: { page_number: number }, b: { page_number: number }) => a.page_number - b.page_number)
                .map((page: {
                    id: string;
                    page_number: number;
                    page_type: string;
                    background_color: string;
                    background_image?: string;
                    text_elements: unknown[];
                    image_elements: unknown[];
                    created_at: string;
                    updated_at: string;
                }) => ({
                    id: page.id,
                    pageNumber: page.page_number,
                    type: page.page_type,
                    backgroundColor: page.background_color,
                    backgroundImage: page.background_image,
                    textElements: page.text_elements,
                    imageElements: page.image_elements,
                    createdAt: new Date(page.created_at),
                    updatedAt: new Date(page.updated_at),
                })),
            status: updatedBook.status,
            updatedAt: new Date(updatedBook.updated_at),
        });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/books/[bookId] - Delete a book
export async function DELETE(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { bookId } = await context.params;
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Delete images from Storage first (clean up assets)
        const storagePath = `${user.id}/${bookId}`;
        const { data: listData, error: listError } = await supabase.storage
            .from('book-images')
            .list(storagePath);

        if (!listError && listData && listData.length > 0) {
            const filesToRemove = listData.map(file => `${storagePath}/${file.name}`);
            const { error: removeError } = await supabase.storage
                .from('book-images')
                .remove(filesToRemove);

            if (removeError) {
                console.error('Error removing book images:', removeError);
            }
        }

        // Delete the book (pages will be cascade deleted)
        const { error } = await supabase
            .from('books')
            .delete()
            .eq('id', bookId)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error deleting book:', error);
            return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
