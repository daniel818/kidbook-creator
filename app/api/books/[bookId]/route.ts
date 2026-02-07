// ============================================
// Single Book API - GET / PUT / DELETE
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createRequestLogger } from '@/lib/logger';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

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
        const logger = createRequestLogger(request);
        logger.debug({ bookId }, 'GET /api/books/[bookId] started');

        logger.debug('Creating Supabase client');
        const supabaseStartTime = Date.now();
        const supabase = await createClient();
        logger.debug({ durationMs: Date.now() - supabaseStartTime }, 'Supabase client created');

        logger.debug('Authenticating user');
        const authStartTime = Date.now();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        logger.debug({ durationMs: Date.now() - authStartTime }, 'Authentication completed');

        if (authError || !user) {
            logger.debug({ error: authError?.message }, 'Unauthorized');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        logger.debug({ userId: user.id }, 'User authenticated');

        // Rate limit standard API calls
        const rateResult = checkRateLimit(`standard:${user.id}`, RATE_LIMITS.standard);
        if (!rateResult.allowed) {
            logger.info({ userId: user.id }, 'Rate limited: books/[bookId] GET');
            return rateLimitResponse(rateResult);
        }

        logger.debug('Fetching book from database');
        const dbStartTime = Date.now();
        const { data: book, error } = await supabase
            .from('books')
            .select(`*, pages (*)`)
            .eq('id', bookId)
            .eq('user_id', user.id)
            .single();
        logger.debug({ durationMs: Date.now() - dbStartTime }, 'Database query completed');

        if (error || !book) {
            logger.debug({ error: error?.message }, 'Book not found');
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }
        logger.debug({ title: book.title, pageCount: book.pages?.length || 0 }, 'Book found');

        logger.debug('Transforming response');
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
            ? responsePages.map((page: { pageNumber: number; textElements: unknown[]; imageElements: unknown[]; [key: string]: unknown }) => {
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

        // Compute illustration progress from page data
        const insidePagesForProgress = responsePages.filter((p: { type: string }) => p.type === 'inside');
        const pagesWithImages = insidePagesForProgress.filter((p: { imageElements: unknown[] }) => {
            const imgs = Array.isArray(p.imageElements) ? p.imageElements : [];
            return imgs.length > 0 && (imgs[0] as { src?: string })?.src;
        }).length;
        const totalInsidePages = insidePagesForProgress.length;

        // Consider generation "still running" only if the book was created recently (within 15 min)
        const bookCreatedAt = new Date(book.created_at || book.updated_at).getTime();
        const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
        const isRecentBook = Number.isFinite(bookCreatedAt) && bookCreatedAt > fifteenMinutesAgo;

        const illustrationProgress = {
            completed: pagesWithImages,
            total: totalInsidePages,
            isGenerating: totalInsidePages > 0 && pagesWithImages < totalInsidePages && isRecentBook,
        };

        const response = {
            id: book.id,
            settings: {
                title: book.title,
                childName: book.child_name,
                childAge: book.child_age,
                childGender: book.child_gender || undefined,
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
            illustrationProgress,
        };
        logger.debug({ durationMs: Date.now() - transformStartTime }, 'Transform completed');

        const totalDuration = Date.now() - requestStartTime;
        logger.debug({ bookId, durationMs: totalDuration }, 'GET /api/books/[bookId] complete');

        return NextResponse.json(response);
    } catch (error) {
        const totalDuration = Date.now() - requestStartTime;
        const logger = createRequestLogger(request);
        logger.error({ err: error, bookId, durationMs: totalDuration }, 'GET /api/books/[bookId] failed');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/books/[bookId] - Update a book
export async function PUT(
    request: NextRequest,
    context: RouteContext
) {
    const logger = createRequestLogger(request);
    try {
        const { bookId } = await context.params;
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limit standard API calls
        const rateResultPut = checkRateLimit(`standard:${user.id}`, RATE_LIMITS.standard);
        if (!rateResultPut.allowed) {
            logger.info({ userId: user.id }, 'Rate limited: books/[bookId] PUT');
            return rateLimitResponse(rateResultPut);
        }

        const { data: bookAccess, error: accessError } = await supabase
            .from('books')
            .select('id, is_preview, status, digital_unlock_paid, user_id')
            .eq('id', bookId)
            .eq('user_id', user.id)
            .single();

        if (accessError || !bookAccess) {
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }

        const isPreview = !!bookAccess.is_preview || bookAccess.status === 'preview';
        const hasPaidAccess = !isPreview || !!bookAccess.digital_unlock_paid;
        if (!hasPaidAccess) {
            return NextResponse.json({ error: 'Unlock required' }, { status: 402 });
        }

        const body = await request.json();
        const { settings, pages, pageEdits, status } = body;

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
                    child_gender: settings.childGender || null,
                    age_group: settings.ageGroup,
                    book_type: settings.bookType,
                    book_theme: settings.bookTheme,
                    status: status || 'draft',
                })
                .eq('id', bookId)
                .eq('user_id', user.id);

            if (bookError) {
                logger.error({ err: bookError }, 'Error updating book');
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
                logger.error({ err: pagesError }, 'Error updating pages');
                return NextResponse.json({ error: 'Failed to update pages' }, { status: 500 });
            }
        }

        // Surgical page edits — update only specific fields on specific pages
        // Safe to use during background generation since it reads current DB state first
        if (pageEdits && Array.isArray(pageEdits) && pageEdits.length > 0) {
            for (const edit of pageEdits) {
                if (!edit.pageId) continue;

                // Fetch current page data from DB (not from client)
                const { data: currentPage, error: fetchError } = await supabase
                    .from('pages')
                    .select('id, text_elements, image_elements')
                    .eq('id', edit.pageId)
                    .eq('book_id', bookId)
                    .single();

                if (fetchError || !currentPage) {
                    logger.error({ pageId: edit.pageId }, 'Page not found for edit');
                    continue;
                }

                const updates: Record<string, unknown> = {};

                if (edit.text !== undefined) {
                    const textElements = Array.isArray(currentPage.text_elements)
                        ? [...currentPage.text_elements] as Record<string, unknown>[]
                        : [];
                    if (textElements.length > 0) {
                        textElements[0] = { ...textElements[0], content: edit.text };
                    }
                    updates.text_elements = textElements;
                }

                if (edit.image !== undefined) {
                    const imageElements = Array.isArray(currentPage.image_elements)
                        ? [...currentPage.image_elements] as Record<string, unknown>[]
                        : [];
                    if (imageElements.length > 0) {
                        imageElements[0] = { ...imageElements[0], src: edit.image };
                    }
                    updates.image_elements = imageElements;
                }

                if (Object.keys(updates).length > 0) {
                    const { error: updateError } = await supabase
                        .from('pages')
                        .update(updates)
                        .eq('id', edit.pageId)
                        .eq('book_id', bookId);

                    if (updateError) {
                        logger.error({ err: updateError, pageId: edit.pageId }, 'Error updating page');
                    }
                }
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
        logger.error({ err: error }, 'Error updating book');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/books/[bookId] - Delete a book
export async function DELETE(
    request: NextRequest,
    context: RouteContext
) {
    const logger = createRequestLogger(request);
    try {
        const { bookId } = await context.params;
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limit standard API calls
        const rateResultDel = checkRateLimit(`standard:${user.id}`, RATE_LIMITS.standard);
        if (!rateResultDel.allowed) {
            logger.info({ userId: user.id }, 'Rate limited: books/[bookId] DELETE');
            return rateLimitResponse(rateResultDel);
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
                logger.error({ err: removeError }, 'Error removing book images');
            }
        }

        // Delete the book (pages will be cascade deleted)
        const { error } = await supabase
            .from('books')
            .delete()
            .eq('id', bookId)
            .eq('user_id', user.id);

        if (error) {
            logger.error({ err: error }, 'Error deleting book');
            return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error({ err: error }, 'Error deleting book');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
