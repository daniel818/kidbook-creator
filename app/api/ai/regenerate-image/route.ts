
import { NextRequest, NextResponse } from 'next/server';
import { generateIllustration } from '@/lib/gemini/client';
import { uploadImageToStorage } from '@/lib/supabase/upload';
import { createClient } from '@/lib/supabase/server';
import { createRequestLogger } from '@/lib/logger';
import { sanitizeInput } from '@/lib/sanitize';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
    const logger = createRequestLogger(req);
    logger.info('Regenerate image request received');
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            logger.info('Unauthorized regenerate attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limit by user ID
        const rateResult = checkRateLimit(`ai:${user.id}`, RATE_LIMITS.ai);
        if (!rateResult.allowed) {
            logger.info({ userId: user.id, retryAfter: rateResult.retryAfterSeconds }, 'Rate limited: ai/regenerate-image');
            return rateLimitResponse(rateResult, 'Too many AI requests. Please wait before trying again.');
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (profileError || !profile?.is_admin) {
            logger.info({ userId: user.id }, 'Forbidden regenerate attempt');
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { bookId, pageNumber, prompt, currentImageContext, style, quality } = body;
        logger.debug({ bookId, pageNumber, hasPrompt: !!prompt }, 'Parsed body');

        if (!bookId || !pageNumber || !prompt) {
            logger.info('Missing fields');
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        logger.info({ bookId, pageNumber }, 'Starting generation');

        // 1. Generate new image
        logger.debug('Calling generateIllustration');
        const imageResult = await generateIllustration({
            scenePrompt: sanitizeInput(prompt, 'storyDescription'),
            characterDescription: sanitizeInput(style || 'A cute child character', 'characterDescription'),
            artStyle: currentImageContext || 'storybook_classic',
            quality: quality || 'fast',
        });
        logger.debug({ hasImageUrl: !!imageResult?.imageUrl }, 'generateIllustration returned');

        if (!imageResult || !imageResult.imageUrl) {
            throw new Error('Failed to generate image (empty response)');
        }

        // Extract base64 from imageUrl
        const imageBase64 = imageResult.imageUrl;
        const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            logger.error('Invalid base64 format');
            throw new Error('Invalid image data returned from generator');
        }
        const imageBuffer = Buffer.from(matches[2], 'base64');
        logger.debug({ bufferSize: imageBuffer.length }, 'Buffer created');

        // 2. Upload to storage
        logger.debug('Uploading to storage');
        const imageUrl = await uploadImageToStorage(bookId, pageNumber, imageBuffer);

        logger.info({ imageUrl }, 'Upload success');

        return NextResponse.json({ imageUrl });

    } catch (error: any) {
        logger.error({ err: error }, 'Error in regeneration');
        return NextResponse.json(
            { error: 'Failed to regenerate image: ' + error.message },
            { status: 500 }
        );
    }
}
