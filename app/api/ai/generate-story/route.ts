// ============================================
// AI Story Generation API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateStory, StoryGenerationInput } from '@/lib/gemini/client';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limit by user ID
        const rateResult = checkRateLimit(`ai:${user.id}`, RATE_LIMITS.ai);
        if (!rateResult.allowed) {
            console.log(`[Rate Limit] ai/generate-story blocked for user ${user.id}`);
            return rateLimitResponse(rateResult, 'Too many AI requests. Please wait before trying again.');
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
        console.error('Story generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate story' },
            { status: 500 }
        );
    }
}
