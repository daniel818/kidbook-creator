// ============================================
// AI Story Generation API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateStory, StoryGenerationInput } from '@/lib/gemini/client';
import { createRequestLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { childName, childAge, childGender, bookTheme, bookType, pageCount, characterDescription } = body;
        const resolvedBookType = bookType || 'story';

        if (!childName || !bookTheme) {
            return NextResponse.json(
                { error: 'Missing required fields: childName, bookTheme' },
                { status: 400 }
            );
        }

        const input: StoryGenerationInput = {
            childName,
            childAge: childAge || 5,
            childGender,
            bookTheme,
            bookType: resolvedBookType,
            pageCount: pageCount || 10,
            characterDescription,
        };

        const story = await generateStory(input);

        return NextResponse.json({
            success: true,
            story,
        });
    } catch (error) {
        const logger = createRequestLogger(request);
        logger.error({ err: error }, 'Story generation error');
        return NextResponse.json(
            { error: 'Failed to generate story' },
            { status: 500 }
        );
    }
}
