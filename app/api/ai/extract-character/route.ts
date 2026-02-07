// ============================================
// Character Extraction API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractCharacterFromPhoto } from '@/lib/gemini/client';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limit by user ID (AI extraction is expensive)
        const rateResult = checkRateLimit(`ai:${user.id}`, RATE_LIMITS.ai);
        if (!rateResult.allowed) {
            console.log(`[Rate Limit] ai/extract-character blocked for user ${user.id}`);
            return rateLimitResponse(rateResult, 'Too many AI requests. Please wait before trying again.');
        }

        const formData = await request.formData();
        const file = formData.get('photo') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No photo provided' },
                { status: 400 }
            );
        }

        // Convert file to base64
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        const characterDescription = await extractCharacterFromPhoto(base64);

        return NextResponse.json({
            success: true,
            characterDescription,
        });
    } catch (error) {
        console.error('Character extraction error:', error);
        return NextResponse.json(
            { error: 'Failed to extract character from photo' },
            { status: 500 }
        );
    }
}
