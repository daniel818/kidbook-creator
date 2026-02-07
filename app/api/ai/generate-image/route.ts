// ============================================
// AI Image Generation API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateIllustration } from '@/lib/gemini/client';
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
            console.log(`[Rate Limit] ai/generate-image blocked for user ${user.id}`);
            return rateLimitResponse(rateResult, 'Too many AI requests. Please wait before trying again.');
        }

        const body = await request.json();
        const { prompt, style } = body;

        if (!prompt) {
            return NextResponse.json(
                { error: 'Missing required field: prompt' },
                { status: 400 }
            );
        }

        const imageData = await generateIllustration({
            scenePrompt: prompt,
            characterDescription: style || '',
        });

        return NextResponse.json({
            success: true,
            image: imageData,
        });
    } catch (error) {
        console.error('Image generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate image' },
            { status: 500 }
        );
    }
}
