// ============================================
// Complete Book Generation API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateCompleteBook, StoryGenerationInput } from '@/lib/gemini/client';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { childName, childAge, bookTheme, bookType, pageCount, characterDescription, storyDescription, artStyle, imageQuality } = body;

        if (!childName || !bookTheme || !bookType) {
            return NextResponse.json(
                { error: 'Missing required fields: childName, bookTheme, bookType' },
                { status: 400 }
            );
        }

        // Authenticate User
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const input: StoryGenerationInput = {
            childName,
            childAge: childAge || 5,
            bookTheme,
            bookType,
            pageCount: pageCount || 10,
            characterDescription,
            storyDescription,
            artStyle: artStyle || 'storybook_classic',
            imageQuality: imageQuality || 'fast', // [NEW]
        };

        // Generate the complete book (story + illustrations)
        console.log('Starting book generation...');
        const result = await generateCompleteBook(input);

        // Identifiers
        const userId = user.id;
        const bookId = crypto.randomUUID();

        // ---------------------------------------------------------
        // IMAGE UPLOAD LOGIC
        // ---------------------------------------------------------
        console.log('Processing and uploading images...');
        for (let i = 0; i < result.illustrations.length; i++) {
            const base64Image = result.illustrations[i];
            if (!base64Image || base64Image.length < 100) continue;

            try {
                const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

                if (matches && matches.length === 3) {
                    const contentType = matches[1];
                    const buffer = Buffer.from(matches[2], 'base64');
                    const fileName = `${userId}/${bookId}/${i}.png`;

                    const { error: uploadError } = await supabase.storage
                        .from('book-images')
                        .upload(fileName, buffer, {
                            contentType,
                            upsert: true
                        });

                    if (uploadError) {
                        console.warn(`Failed to upload image ${i}:`, uploadError);
                    } else {
                        const { data: { publicUrl } } = supabase.storage
                            .from('book-images')
                            .getPublicUrl(fileName);

                        console.log(`Image ${i} uploaded -> ${publicUrl}`);
                        result.illustrations[i] = publicUrl;
                    }
                }
            } catch (imageError) {
                console.error(`Error processing image ${i}:`, imageError);
            }
        }

        const getAgeGroup = (age: number) => {
            if (age <= 2) return '0-2';
            if (age <= 5) return '3-5';
            if (age <= 8) return '6-8';
            return '9-12';
        };

        // Insert into Database
        const { error: dbError } = await supabase.from('books').insert({
            id: bookId,
            user_id: userId,
            title: result.story.title,
            child_name: childName,
            child_age: childAge,
            age_group: getAgeGroup(childAge || 5),
            book_theme: bookTheme,
            book_type: bookType,
            status: 'draft',
        });

        if (dbError) throw dbError;

        const pagesData = result.story.pages.map((page, index) => ({
            book_id: bookId,
            page_number: page.pageNumber,
            page_type: page.pageNumber === 1 ? 'cover' : 'inside',
            background_color: '#ffffff',
            text_elements: page.text ? [{
                id: crypto.randomUUID(),
                content: page.text,
                x: 10, y: 70, width: 80, fontSize: 18,
                fontFamily: 'Inter', color: '#333333', textAlign: 'center', fontWeight: 'normal'
            }] : [],
            image_elements: result.illustrations[index] ? [{
                id: crypto.randomUUID(),
                src: result.illustrations[index],
                x: 0, y: 0, width: 100, height: 100,
                rotation: 0
            }] : []
        }));

        const { error: pagesError } = await supabase.from('pages').insert(pagesData);

        if (pagesError) throw pagesError;

        return NextResponse.json({
            success: true,
            bookId: bookId
        });

    } catch (error) {
        console.error('Book generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate book' },
            { status: 500 }
        );
    }
}
