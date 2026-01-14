// ============================================
// Complete Book Generation API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateCompleteBook, StoryGenerationInput } from '@/lib/gemini/client';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { childName, childAge, bookTheme, bookType, pageCount, characterDescription } = body;

        if (!childName || !bookTheme || !bookType) {
            return NextResponse.json(
                { error: 'Missing required fields: childName, bookTheme, bookType' },
                { status: 400 }
            );
        }

        const input: StoryGenerationInput = {
            childName,
            childAge: childAge || 5,
            bookTheme,
            bookType,
            pageCount: pageCount || 10,
            characterDescription,
        };

        // Generate the complete book (story + illustrations)
        const result = await generateCompleteBook(input);

        // Create the book in the database
        const { data: book, error: bookError } = await supabase
            .from('books')
            .insert({
                user_id: user.id,
                title: result.story.title,
                child_name: childName,
                child_age: childAge,
                book_theme: bookTheme,
                book_type: bookType,
                status: 'draft',
            })
            .select()
            .single();

        if (bookError) {
            console.error('Error creating book:', bookError);
            return NextResponse.json({ error: 'Failed to create book' }, { status: 500 });
        }

        // Create pages with generated content
        const pagesData = result.story.pages.map((page, index) => ({
            book_id: book.id,
            page_number: page.pageNumber,
            page_type: page.pageNumber === 1 ? 'cover' : 'content',
            background_color: '#ffffff',
            background_image: result.illustrations[index] || null,
            text_elements: page.text ? [{
                id: crypto.randomUUID(),
                content: page.text,
                x: 10,
                y: 70,
                width: 80,
                fontSize: 18,
                fontFamily: 'Inter',
                color: '#333333',
                textAlign: 'center',
            }] : [],
            image_elements: [],
        }));

        const { error: pagesError } = await supabase
            .from('pages')
            .insert(pagesData);

        if (pagesError) {
            console.error('Error creating pages:', pagesError);
            // Rollback: delete the book
            await supabase.from('books').delete().eq('id', book.id);
            return NextResponse.json({ error: 'Failed to create pages' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            bookId: book.id,
            title: result.story.title,
            pageCount: result.story.pages.length,
        });
    } catch (error) {
        console.error('Book generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate book' },
            { status: 500 }
        );
    }
}
