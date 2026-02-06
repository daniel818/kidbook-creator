// ============================================
// AI Story Generation API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateStory, StoryGenerationInput } from '@/lib/gemini/client';
import { generateStorySchema, parseBody } from '@/lib/validations';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Validate request body with Zod
        const { data, error: validationError } = parseBody(generateStorySchema, body);
        if (validationError) {
            return NextResponse.json(
                { error: validationError },
                { status: 400 }
            );
        }

        const input: StoryGenerationInput = {
            childName: data.childName,
            childAge: data.childAge,
            childGender: data.childGender,
            bookTheme: data.bookTheme,
            bookType: data.bookType,
            pageCount: data.pageCount,
            characterDescription: data.characterDescription,
        };

        const story = await generateStory(input);

        return NextResponse.json({
            success: true,
            story,
        });
    } catch (error) {
        console.error('Story generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate story' },
            { status: 500 }
        );
    }
}
