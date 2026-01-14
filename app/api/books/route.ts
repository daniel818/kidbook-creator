// ============================================
// Books API - GET / POST
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/books - Get all books for the current user
export async function GET() {
    try {
        const supabase = await createClient();

        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get all books with their pages
        const { data: books, error } = await supabase
            .from('books')
            .select(`
        *,
        pages (*)
      `)
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching books:', error);
            return NextResponse.json(
                { error: 'Failed to fetch books' },
                { status: 500 }
            );
        }

        // Transform to match our Book type
        interface DbBook {
            id: string;
            title: string;
            child_name: string;
            child_age: number;
            age_group: string;
            book_type: string;
            book_theme: string;
            status: string;
            thumbnail_url: string | null;
            created_at: string;
            updated_at: string;
            pages: DbPage[];
        }

        interface DbPage {
            id: string;
            page_number: number;
            page_type: string;
            background_color: string;
            background_image?: string;
            text_elements: unknown[];
            image_elements: unknown[];
            created_at: string;
            updated_at: string;
        }

        const transformedBooks = (books as DbBook[]).map((book: DbBook) => ({
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
        }));

        return NextResponse.json(transformedBooks);
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/books - Create a new book
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { settings } = body;

        if (!settings) {
            return NextResponse.json(
                { error: 'Book settings are required' },
                { status: 400 }
            );
        }

        // Create the book
        const { data: book, error: bookError } = await supabase
            .from('books')
            .insert({
                user_id: user.id,
                title: settings.title,
                child_name: settings.childName,
                child_age: settings.childAge,
                age_group: settings.ageGroup,
                book_type: settings.bookType,
                book_theme: settings.bookTheme,
                status: 'draft',
            })
            .select()
            .single();

        if (bookError) {
            console.error('Error creating book:', bookError);
            return NextResponse.json(
                { error: 'Failed to create book' },
                { status: 500 }
            );
        }

        // Create the cover page
        const { data: page, error: pageError } = await supabase
            .from('pages')
            .insert({
                book_id: book.id,
                page_number: 0,
                page_type: 'cover',
                text_elements: [
                    {
                        id: crypto.randomUUID(),
                        content: settings.title || `${settings.childName}'s Book`,
                        x: 50,
                        y: 40,
                        fontSize: 48,
                        fontFamily: 'Outfit',
                        color: '#ffffff',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        width: 80,
                    }
                ],
                image_elements: [],
            })
            .select()
            .single();

        if (pageError) {
            console.error('Error creating page:', pageError);
            // Clean up the book if page creation failed
            await supabase.from('books').delete().eq('id', book.id);
            return NextResponse.json(
                { error: 'Failed to create book page' },
                { status: 500 }
            );
        }

        // Return the created book
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
            pages: [{
                id: page.id,
                pageNumber: page.page_number,
                type: page.page_type,
                backgroundColor: page.background_color,
                textElements: page.text_elements,
                imageElements: page.image_elements,
                createdAt: new Date(page.created_at),
                updatedAt: new Date(page.updated_at),
            }],
            status: book.status,
            createdAt: new Date(book.created_at),
            updatedAt: new Date(book.updated_at),
        }, { status: 201 });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
