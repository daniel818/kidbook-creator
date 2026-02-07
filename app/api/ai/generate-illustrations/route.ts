// ============================================
// Background Illustration Generation API
// Generates illustrations one-by-one for pages
// that have image_prompt but no image yet.
// Each page is updated in the DB as it completes,
// allowing the viewer to poll and display progressively.
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { generateIllustration } from '@/lib/gemini/client';
import { uploadImageToStorage } from '@/lib/supabase/upload';
import { createRequestLogger } from '@/lib/logger';

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

// Pricing Constants (same as generate-book)
const PRICING: Record<string, { input?: number; output?: number; image?: number }> = {
    'gemini-3-flash-preview': { input: 0.10 / 1_000_000, output: 0.40 / 1_000_000 },
    'gemini-3-pro-image-preview': { image: 0.04 },
    'gemini-2.5-flash-image': { image: 0.039 },
};

function calculateImageCost(model: string): number {
    let rate = 0.04;
    if (model.includes('ultra') || model.includes('pro')) rate = 0.08;
    const pricing = PRICING[model];
    if (pricing?.image) rate = pricing.image;
    return rate;
}

export async function POST(request: NextRequest) {
    const logger = createRequestLogger(request);
    const startTime = Date.now();
    logger.info('Background illustration generation started');

    try {
        // Authenticate via internal API key
        const internalKey = request.headers.get('x-internal-key');
        if (!INTERNAL_API_KEY || !internalKey || internalKey !== INTERNAL_API_KEY) {
            logger.error('Unauthorized - invalid or missing internal key');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            bookId,
            userId,
            characterDescription,
            artStyle = 'storybook_classic',
            imageQuality = 'fast',
            childPhoto,
            aspectRatio = '3:4',
            language = 'en',
            isPreview = false,
            previewPageCount = 3,
            styleReferenceImage: initialStyleRef,
        } = body;

        if (!bookId || !userId) {
            logger.error('Missing required fields');
            return NextResponse.json({ error: 'Missing bookId or userId' }, { status: 400 });
        }

        logger.debug({ bookId, userId, artStyle, isPreview, previewPageCount }, 'Request params');

        const db = await createAdminClient();

        // Fetch book + pages
        const { data: book, error: bookError } = await db
            .from('books')
            .select('*, pages (*)')
            .eq('id', bookId)
            .eq('user_id', userId)
            .single();

        if (bookError || !book) {
            logger.error({ err: bookError }, 'Book not found');
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }

        const pages = (book.pages || [])
            .sort((a: { page_number: number }, b: { page_number: number }) => a.page_number - b.page_number);

        const bookTitle = book.title || '';
        const totalInsidePages = pages.filter((p: { page_type: string }) =>
            p.page_type === 'inside' || p.page_type === 'cover'
        ).length;

        // Use initial style reference from caller, or load page 1's image from DB
        let styleReferenceImage = initialStyleRef;
        if (!styleReferenceImage) {
            const firstPage = pages.find((p: { page_type: string; image_elements: unknown[] }) => {
                const imgs = Array.isArray(p.image_elements) ? p.image_elements : [];
                return imgs.length > 0 && (imgs[0] as { src?: string })?.src;
            });
            if (firstPage) {
                const imgSrc = (firstPage.image_elements[0] as { src: string }).src;
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
                // Guard against empty supabaseUrl to prevent SSRF
                const isAllowedOrigin = imgSrc.startsWith('data:') ||
                    (supabaseUrl.length > 0 && imgSrc.startsWith(supabaseUrl));
                if (isAllowedOrigin) {
                    try {
                        const resp = await fetch(imgSrc);
                        if (resp.ok) {
                            const contentType = resp.headers.get('content-type') || 'image/png';
                            const contentLength = parseInt(resp.headers.get('content-length') || '0', 10);
                            if (contentLength <= 10 * 1024 * 1024) {
                                const buffer = Buffer.from(await resp.arrayBuffer());
                                styleReferenceImage = `data:${contentType};base64,${buffer.toString('base64')}`;
                                logger.debug('Loaded page 1 image as style reference from DB');
                            }
                        }
                    } catch (err) {
                        logger.warn({ err }, 'Failed to load style reference from DB');
                    }
                }
            }
        }

        // Count eligible pages (inside pages without images) for accurate limit
        const eligiblePages = pages.filter((p: { page_type: string; image_elements: unknown[]; image_prompt?: string; page_number: number }) => {
            if (p.page_type !== 'inside') return false;
            if (isPreview && p.page_number > previewPageCount) return false;
            const imgs = Array.isArray(p.image_elements) ? p.image_elements : [];
            if (imgs.length > 0 && (imgs[0] as { src?: string })?.src) return false;
            if (!p.image_prompt) return false;
            return true;
        });
        const maxIllustrations = isPreview ? Math.min(previewPageCount, eligiblePages.length) : eligiblePages.length;
        let generatedCount = 0;

        // Rate limit delay between images
        const SAFETY_DELAY_MS = 2000;

        for (const page of pages) {
            // Enforce generation limit
            if (generatedCount >= maxIllustrations) {
                logger.info({ maxIllustrations }, 'Reached max illustrations limit, stopping');
                break;
            }

            const pageType = page.page_type as string;
            if (pageType !== 'inside') continue;

            // For preview mode, only generate up to previewPageCount
            if (isPreview && page.page_number > previewPageCount) continue;

            // Skip pages that already have images
            const imageElements = Array.isArray(page.image_elements) ? page.image_elements : [];
            if (imageElements.length > 0 && (imageElements[0] as { src?: string })?.src) {
                continue;
            }

            const prompt = page.image_prompt as string | undefined;
            if (!prompt) continue;

            logger.debug({ pageNumber: page.page_number }, 'Generating illustration for page');
            const pageStartTime = Date.now();

            try {
                const { imageUrl, usage } = await generateIllustration({
                    scenePrompt: prompt,
                    characterDescription: characterDescription || `A cute child named ${book.child_name}`,
                    artStyle,
                    quality: imageQuality,
                    referenceImage: childPhoto,
                    aspectRatio,
                    language,
                    styleReferenceImage: page.page_number > 1 ? styleReferenceImage : undefined,
                    pageNumber: page.page_number,
                    totalPages: totalInsidePages,
                    bookTitle,
                });

                // Extract base64 and upload to storage
                const matches = imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (!matches || matches.length !== 3) {
                    logger.error({ pageNumber: page.page_number }, 'Invalid image data for page');
                    continue;
                }
                const imageBuffer = Buffer.from(matches[2], 'base64');
                const storedUrl = await uploadImageToStorage(bookId, page.page_number, imageBuffer);

                // Update this page in DB immediately
                const { error: updateError } = await db
                    .from('pages')
                    .update({
                        image_elements: [{
                            id: crypto.randomUUID(),
                            src: storedUrl,
                            x: 0,
                            y: 0,
                            width: 100,
                            height: 100,
                            rotation: 0,
                        }]
                    })
                    .eq('id', page.id);

                if (updateError) {
                    logger.error({ err: updateError, pageNumber: page.page_number }, 'DB update failed for page');
                    continue;
                }

                // Capture first generated image as style reference
                if (generatedCount === 0 && !styleReferenceImage) {
                    styleReferenceImage = imageUrl;
                    logger.debug('Captured first generated image as style reference');
                }

                // Log generation cost
                const imageCost = calculateImageCost(usage.model);
                await db.from('generation_logs').insert({
                    book_id: bookId,
                    step_name: `bg_illustration_page_${page.page_number}`,
                    model_name: usage.model,
                    input_tokens: 0,
                    output_tokens: 0,
                    image_count: 1,
                    cost_usd: imageCost,
                });

                generatedCount++;
                logger.info({ pageNumber: page.page_number, durationMs: Date.now() - pageStartTime, generatedCount }, 'Page completed');

            } catch (err) {
                logger.error({ err, pageNumber: page.page_number }, 'Error generating page');
                // Retry once
                try {
                    logger.info({ pageNumber: page.page_number }, 'Retrying page');
                    await new Promise(r => setTimeout(r, SAFETY_DELAY_MS));
                    const { imageUrl } = await generateIllustration({
                        scenePrompt: prompt,
                        characterDescription: characterDescription || `A cute child named ${book.child_name}`,
                        artStyle,
                        quality: imageQuality,
                        referenceImage: childPhoto,
                        aspectRatio,
                        language,
                        styleReferenceImage: page.page_number > 1 ? styleReferenceImage : undefined,
                        pageNumber: page.page_number,
                        totalPages: totalInsidePages,
                        bookTitle,
                    });
                    const matches = imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                    if (matches && matches.length === 3) {
                        const imageBuffer = Buffer.from(matches[2], 'base64');
                        const storedUrl = await uploadImageToStorage(bookId, page.page_number, imageBuffer);
                        const { error: retryUpdateError } = await db
                            .from('pages')
                            .update({
                                image_elements: [{
                                    id: crypto.randomUUID(),
                                    src: storedUrl,
                                    x: 0, y: 0, width: 100, height: 100, rotation: 0,
                                }]
                            })
                            .eq('id', page.id);
                        if (retryUpdateError) {
                            logger.error({ err: retryUpdateError, pageNumber: page.page_number }, 'DB update failed on retry for page');
                        } else {
                            generatedCount++;
                            logger.info({ pageNumber: page.page_number }, 'Retry succeeded for page');
                        }
                    }
                } catch (retryErr) {
                    logger.error({ err: retryErr, pageNumber: page.page_number }, 'Retry also failed for page');
                }
            }

            // Delay between generations for rate limits
            await new Promise(r => setTimeout(r, SAFETY_DELAY_MS));
        }

        logger.info({ generatedCount, durationMs: Date.now() - startTime }, 'Background illustration generation complete');
        return NextResponse.json({ success: true, generatedCount });

    } catch (error) {
        logger.error({ err: error, durationMs: Date.now() - startTime }, 'Background illustration generation failed');
        return NextResponse.json({ error: 'Failed to generate illustrations' }, { status: 500 });
    }
}
