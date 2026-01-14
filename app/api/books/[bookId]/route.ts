// ============================================
// Single Book API - GET / PUT / DELETE
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteContext {
    params: Promise<{ bookId: string }>;
}

// GET /api/books/[bookId] - Get a single book with pages
export async function GET(
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

        const { data: book, error } = await supabase
            .from('books')
            .select(`*, pages (*)`)
            .eq('id', bookId)
            .eq('user_id', user.id)
            .single();

        if (error || !book) {
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }

        return NextResponse.json({
            id: book.id,
            settings: {
                title: book.title,
                childName: book.child_name,
                childAge: book.child_age,
                ageGroup: book.age_group,
                bookType: book.book_type,
                bookTheme: book.book_theme,
            },
            pages: book.pages
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
            status: book.status,
            thumbnailUrl: book.thumbnail_url,
            createdAt: new Date(book.created_at),
            updatedAt: new Date(book.updated_at),
        });
    } catch (error) {
        console.error('Error:', error);
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

        // Update book settings if provided
        if (settings) {
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

            // Upsert all pages
            for (const page of pages) {
                const pageData = {
                    id: page.id,
                    book_id: bookId,
                    page_number: page.pageNumber,
                    page_type: page.type,
                    background_color: page.backgroundColor,
                    background_image: page.backgroundImage,
                    text_elements: page.textElements,
                    image_elements: page.imageElements,
                };

                if (existingIds.has(page.id)) {
                    await supabase.from('pages').update(pageData).eq('id', page.id);
                } else {
                    await supabase.from('pages').insert(pageData);
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
