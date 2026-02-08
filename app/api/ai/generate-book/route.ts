// ============================================
// Complete Book Generation API
// Phase 1: Generate story text + cover illustration (synchronous)
// Phase 2: Trigger background illustration generation (fire-and-forget)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateQuota } from '@/lib/quota';
import { generateStory, generateIllustration, StoryGenerationInput } from '@/lib/gemini/client';
import { uploadReferenceImage, uploadImageToStorage } from '@/lib/supabase/upload';
import { createRequestLogger } from '@/lib/logger';
import { env } from '@/lib/env';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { generateBookSchema, parseBody } from '@/lib/validations';

// Pricing Constants (as per Plan)
const PRICING = {
    'gemini-3-flash-preview': {
        input: 0.10 / 1_000_000,
        output: 0.40 / 1_000_000
    },
    'gemini-3-pro-image-preview': {
        image: 0.04
    },
    'gemini-2.5-flash-image': {
        image: 0.039 // ~$30/1M output tokens (approx 1290 tokens/img)
    }
};

const parseDataUrl = (value: unknown): { contentType: string; base64: string } | null => {
    if (typeof value !== 'string') return null;
    if (!value.startsWith('data:')) return null;
    const commaIndex = value.indexOf(',');
    if (commaIndex === -1) return null;
    const header = value.slice(5, commaIndex);
    const base64 = value.slice(commaIndex + 1);
    if (!base64) return null;
    const [contentType] = header.split(';');
    return {
        contentType: contentType || 'image/jpeg',
        base64
    };
};

function calculateCost(gLog: { model: string; inputTokens?: number; outputTokens?: number; imageCount: number }): number {
    let cost = 0;

    // Text Cost
    if (gLog.model.includes('flash') || gLog.model.includes('gemini-3')) {
        const rates = PRICING['gemini-3-flash-preview'];
        cost += (gLog.inputTokens || 0) * rates.input;
        cost += (gLog.outputTokens || 0) * rates.output;
    }

    // Image Cost
    if (gLog.imageCount > 0) {
        let rate = 0.04;
        if (gLog.model.includes('ultra') || gLog.model.includes('pro')) rate = 0.08;
        if (PRICING[gLog.model as keyof typeof PRICING]) {
            // @ts-ignore
            rate = PRICING[gLog.model].image || rate;
        }
        cost += gLog.imageCount * rate;
    }

    return cost;
}

export async function POST(request: NextRequest) {
    const logger = createRequestLogger(request);
    const requestStartTime = Date.now();
    logger.info('Generate-book API request started (Progressive Mode)');

    try {
        logger.debug('Parsing request body');
        const body = await request.json();

        // Validate request body with Zod
        const validation = parseBody(generateBookSchema, body);
        if (!validation.success) {
            logger.warn({ error: validation.error }, 'Validation failed');
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const { childName, childAge, childGender, bookTheme, bookType, pageCount, characterDescription, storyDescription, artStyle, imageQuality, childPhoto, printFormat, language, preview, previewPageCount } = validation.data;
        const resolvedBookType = bookType || 'story';
        logger.debug({ childName, childAge, childGender, bookTheme, bookType: resolvedBookType, artStyle, imageQuality, hasPhoto: !!childPhoto, printFormat, language, preview, previewPageCount }, 'Request body parsed');

        // Authenticate User
        logger.debug('Authenticating user');
        const authStartTime = Date.now();
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        logger.debug({ durationMs: Date.now() - authStartTime }, 'Authentication completed');

        if (authError || !user) {
            logger.info({ err: authError }, 'Unauthorized');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        logger.debug({ userId: user.id }, 'User authenticated');

        // Rate limit by user ID (AI generation is expensive)
        const rateResult = checkRateLimit(`ai:${user.id}`, RATE_LIMITS.ai);
        if (!rateResult.allowed) {
            logger.info({ userId: user.id, retryAfter: rateResult.retryAfterSeconds }, 'Rate limited: ai/generate-book');
            return rateLimitResponse(rateResult, 'Too many AI requests. Please wait before trying again.');
        }

        // Quota check for preview generations
        if (preview === true) {
            const quota = await calculateQuota(user.id, supabase);
            logger.info({ quota }, `Quota check: ${quota.remaining} remaining (${quota.used}/${quota.total})`);

            if (quota.remaining <= 0) {
                logger.warn({ quota }, 'Quota exceeded');
                return NextResponse.json(
                    { error: 'Preview generation quota exceeded', code: 'QUOTA_EXCEEDED', quota },
                    { status: 429 }
                );
            }
        }

        // Determine aspect ratio from print format
        let aspectRatio: '1:1' | '3:4' = '3:4';
        if (printFormat === 'square' || printFormat?.includes('square')) {
            aspectRatio = '1:1';
        }
        logger.debug({ aspectRatio, printFormat }, 'Selected aspect ratio');

        const input: StoryGenerationInput = {
            childName,
            childAge: childAge || 5,
            childGender,
            bookTheme,
            bookType: resolvedBookType,
            pageCount: pageCount || 10,
            characterDescription,
            storyDescription,
            artStyle: artStyle || 'storybook_classic',
            imageQuality: imageQuality || 'fast',
            childPhoto,
            aspectRatio,
            language: language || 'en',
        };

        const isPreview = preview === true;
        const defaultPreviewCount = 3;
        const maxPreviewCount = 4;
        const effectivePreviewCount = Math.min(
            maxPreviewCount,
            Math.max(1, Number(previewPageCount || defaultPreviewCount))
        );

        // =========================================================
        // PHASE 1: Generate story text (fast, ~5 seconds)
        // =========================================================
        logger.debug('Generating story text only');
        const storyStartTime = Date.now();
        const { story, usage: storyUsage } = await generateStory(input);
        logger.info({ durationMs: Date.now() - storyStartTime, title: story.title, pageCount: story.pages.length }, 'Story generated');

        const resolvedCharacterDescription = input.characterDescription || story.characterDescription || `A cute child named ${input.childName}`;

        // =========================================================
        // PHASE 1b: Generate cover illustration (first page only)
        // =========================================================
        logger.debug('Generating cover illustration');
        const coverStartTime = Date.now();
        let coverImageUrl: string | null = null;
        let coverStoredUrl: string | null = null;
        let coverStyleRef: string | undefined;

        const userId = user.id;
        const bookId = crypto.randomUUID();
        logger.debug({ bookId }, 'Created bookId');

        if (story.pages.length > 0) {
            try {
                const firstPage = story.pages[0];
                const { imageUrl, usage: coverUsage } = await generateIllustration({
                    scenePrompt: firstPage.imagePrompt,
                    characterDescription: resolvedCharacterDescription,
                    artStyle: input.artStyle,
                    quality: input.imageQuality,
                    referenceImage: input.childPhoto,
                    aspectRatio: input.aspectRatio,
                    language: input.language || 'en',
                    pageNumber: 1,
                    totalPages: story.pages.length,
                    bookTitle: story.title,
                });

                coverImageUrl = imageUrl;
                coverStyleRef = imageUrl; // Save as style reference for subsequent pages

                // Upload cover image to storage
                const parsed = parseDataUrl(imageUrl);
                if (parsed) {
                    const buffer = Buffer.from(parsed.base64, 'base64');
                    coverStoredUrl = await uploadImageToStorage(bookId, 1, buffer);
                }

                logger.info({ durationMs: Date.now() - coverStartTime }, 'Cover illustration generated');
            } catch (err) {
                logger.warn({ err }, 'Cover illustration generation failed, continuing without it');
            }
        }

        // =========================================================
        // Calculate costs for Phase 1
        // =========================================================
        const generationLogs = [
            {
                stepName: 'story_generation',
                model: storyUsage.model,
                inputTokens: storyUsage.inputTokens,
                outputTokens: storyUsage.outputTokens,
                imageCount: 0,
            },
        ];
        if (coverImageUrl) {
            generationLogs.push({
                stepName: 'cover_illustration',
                model: env.GEMINI_IMAGE_MODEL,
                inputTokens: 0,
                outputTokens: 0,
                imageCount: 1,
            });
        }

        let totalCost = 0;
        const processedLogs = generationLogs.map(gLog => {
            const cost = calculateCost(gLog);
            totalCost += cost;
            return { ...gLog, cost_usd: cost };
        });

        // =========================================================
        // Upload reference image if provided
        // =========================================================
        let referenceImageUrl: string | null = null;
        if (childPhoto) {
            const parsed = parseDataUrl(childPhoto);
            if (parsed) {
                const buffer = Buffer.from(parsed.base64, 'base64');
                try {
                    referenceImageUrl = await uploadReferenceImage(userId, bookId, buffer, parsed.contentType);
                } catch (err) {
                    logger.warn({ err }, 'Reference image upload failed');
                }
            } else {
                logger.warn('childPhoto provided but is not a valid data URL, skipping reference image upload');
            }
        }

        const previewCountClamped = isPreview
            ? Math.min(effectivePreviewCount, story.pages.length)
            : story.pages.length;
        const totalPageCount = story.pages.length + (story.backCoverBlurb ? 1 : 0);

        const getAgeGroup = (age: number) => {
            if (age <= 2) return '0-2';
            if (age <= 5) return '3-5';
            if (age <= 8) return '6-8';
            return '9-12';
        };

        // =========================================================
        // Save book to database
        // =========================================================
        logger.debug('Saving to database');
        const dbStartTime = Date.now();

        const { error: dbError } = await supabase.from('books').insert({
            id: bookId,
            user_id: userId,
            title: story.title,
            child_name: childName,
            child_age: childAge,
            child_gender: childGender || null,
            age_group: getAgeGroup(childAge || 5),
            book_theme: bookTheme,
            book_type: resolvedBookType,
            print_format: aspectRatio === '1:1' ? 'square' : 'portrait',
            status: isPreview ? 'preview' : 'draft',
            estimated_cost: totalCost,
            language: language || 'en',
            is_preview: isPreview,
            preview_page_count: previewCountClamped,
            total_page_count: totalPageCount,
            character_description: resolvedCharacterDescription,
            art_style: artStyle || input.artStyle || null,
            image_quality: imageQuality || input.imageQuality || null,
            story_description: storyDescription || null,
            reference_image_url: referenceImageUrl
        });

        if (dbError) {
            logger.error({ err: dbError }, 'Database insert failed');
            throw dbError;
        }

        // Save generation logs
        const logInserts = processedLogs.map(l => ({
            book_id: bookId,
            step_name: l.stepName,
            model_name: l.model,
            input_tokens: l.inputTokens,
            output_tokens: l.outputTokens,
            image_count: l.imageCount,
            cost_usd: l.cost_usd
        }));

        const { error: logError } = await supabase.from('generation_logs').insert(logInserts);
        if (logError) logger.error({ err: logError }, 'Failed to save generation logs');

        // =========================================================
        // Save pages - cover has image, rest have empty image_elements
        // =========================================================
        const pagesData = story.pages.map((page, index) => ({
            book_id: bookId,
            page_number: page.pageNumber,
            page_type: page.pageNumber === 1 ? 'cover' : 'inside',
            background_color: '#ffffff',
            image_prompt: page.imagePrompt,
            text_elements: page.text ? [{
                id: crypto.randomUUID(),
                content: page.text,
                x: 10, y: 70, width: 80, fontSize: 18,
                fontFamily: 'Inter', color: '#333333', textAlign: 'center', fontWeight: 'normal'
            }] : [],
            // Only the cover (index 0) gets its image now; rest are generated in background
            image_elements: (index === 0 && coverStoredUrl) ? [{
                id: crypto.randomUUID(),
                src: coverStoredUrl,
                x: 0, y: 0, width: 100, height: 100,
                rotation: 0
            }] : []
        }));

        // Add Back Cover Page placeholder (text only, image generated in background)
        if (story.backCoverBlurb) {
            pagesData.push({
                book_id: bookId,
                page_number: pagesData.length + 1,
                page_type: 'back',
                background_color: '#ffffff',
                image_prompt: 'A magical background pattern or simple scenic view suitable for a book back cover. No characters, just atmosphere matching the book theme.',
                text_elements: [{
                    id: crypto.randomUUID(),
                    content: story.backCoverBlurb,
                    x: 15, y: 30, width: 70, fontSize: 14,
                    fontFamily: 'Inter', color: '#000000', textAlign: 'center', fontWeight: 'normal'
                }],
                image_elements: []
            });
        }

        logger.debug({ pageCount: pagesData.length }, 'Saving pages to database');
        const pagesStartTime = Date.now();
        const { error: pagesError } = await supabase.from('pages').insert(pagesData);

        if (pagesError) {
            logger.error({ err: pagesError }, 'Pages insert failed');
            throw pagesError;
        }
        logger.debug({ durationMs: Date.now() - pagesStartTime }, 'Pages saved');
        logger.debug({ durationMs: Date.now() - dbStartTime }, 'Book record & logs saved');

        const totalDuration = Date.now() - requestStartTime;
        logger.info({ durationMs: totalDuration }, 'Phase 1 complete - Story + Cover saved');

        // =========================================================
        // PHASE 2: Fire-and-forget background illustration generation
        // =========================================================
        const internalKey = env.INTERNAL_API_KEY;
        if (internalKey) {
            // Use server-only INTERNAL_API_BASE_URL if set, fall back to NEXT_PUBLIC_APP_URL for dev
            const baseUrl = env.INTERNAL_API_BASE_URL || env.NEXT_PUBLIC_APP_URL;
            logger.info('Triggering background illustration generation');

            fetch(`${baseUrl}/api/ai/generate-illustrations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Internal-Key': internalKey,
                },
                body: JSON.stringify({
                    bookId,
                    userId,
                    characterDescription: resolvedCharacterDescription,
                    artStyle: input.artStyle,
                    imageQuality: input.imageQuality,
                    childPhoto: input.childPhoto,
                    aspectRatio,
                    language: input.language || 'en',
                    isPreview,
                    previewPageCount: effectivePreviewCount,
                    styleReferenceImage: coverStyleRef,
                }),
            }).catch(err => logger.warn({ err }, 'Background illustration trigger failed (non-blocking)'));
        } else {
            logger.warn('INTERNAL_API_KEY not set, skipping background illustration generation');
        }

        return NextResponse.json({
            success: true,
            bookId: bookId
        });

    } catch (error) {
        const totalDuration = Date.now() - requestStartTime;
        logger.error({ err: error, durationMs: totalDuration }, 'Generate-book API request failed');
        return NextResponse.json(
            { error: 'Failed to generate book' },
            { status: 500 }
        );
    }
}
