
import { NextRequest, NextResponse } from 'next/server';
import { generateIllustration } from '@/lib/gemini/client';
import { uploadImageToStorage } from '@/lib/supabase/upload';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, addRateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit';

function log(msg: string, data?: unknown) {
    console.log(`[Regenerate] ${msg}`, data || '');
}

export async function POST(req: NextRequest) {
    log('Request received');
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            log('Unauthorized regenerate attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limit by user ID
        const rateResult = checkRateLimit(`ai:${user.id}`, RATE_LIMITS.ai);
        if (!rateResult.allowed) {
            const response = NextResponse.json(
                { error: 'Too many AI requests. Please wait before trying again.' },
                { status: 429 }
            );
            addRateLimitHeaders(response.headers, rateResult);
            return response;
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (profileError || !profile?.is_admin) {
            log('Forbidden regenerate attempt', { userId: user.id });
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { bookId, pageNumber, prompt, currentImageContext, style, quality } = body;
        log('Parsed body', { bookId, pageNumber, hasPrompt: !!prompt });

        if (!bookId || !pageNumber || !prompt) {
            log('Missing fields');
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        log(`Starting generation for book ${bookId} page ${pageNumber}`);

        // 1. Generate new image
        log('Calling generateIllustration...');
        const imageResult = await generateIllustration({
            scenePrompt: prompt,
            characterDescription: style || 'A cute child character',
            artStyle: currentImageContext || 'storybook_classic',
            quality: quality || 'fast',
        });
        log('generateIllustration returned', { imageUrl: imageResult?.imageUrl });

        if (!imageResult || !imageResult.imageUrl) {
            throw new Error('Failed to generate image (empty response)');
        }

        // Extract base64 from imageUrl
        const imageBase64 = imageResult.imageUrl;
        const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            log('Invalid base64 format');
            throw new Error('Invalid image data returned from generator');
        }
        const imageBuffer = Buffer.from(matches[2], 'base64');
        log(`Buffer created: ${imageBuffer.length} bytes`);

        // 2. Upload to storage
        log('Uploading to storage...');
        const imageUrl = await uploadImageToStorage(bookId, pageNumber, imageBuffer);

        log(`Upload success: ${imageUrl}`);

        return NextResponse.json({ imageUrl });

    } catch (error: any) {
        log('Error in regeneration', error.message + '\n' + error.stack);
        return NextResponse.json(
            { error: 'Failed to regenerate image: ' + error.message },
            { status: 500 }
        );
    }
}
