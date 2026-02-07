// ============================================
// AI Image Generation API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateIllustration } from '@/lib/gemini/client';
import { sanitizeInput } from '@/lib/sanitize';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
            scenePrompt: sanitizeInput(prompt, 'storyDescription'),
            characterDescription: sanitizeInput(style, 'characterDescription'),
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
