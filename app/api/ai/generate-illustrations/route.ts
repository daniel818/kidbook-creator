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
import * as fs from 'fs';
import * as path from 'path';

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

const log = (message: string, data?: unknown) => {
    const timestamp = new Date().toISOString();
    const logMsg = `[API generate-illustrations ${timestamp}] ${message}`;
    console.log(logMsg);
    try {
        const logPath = path.join(process.cwd(), 'api_debug.log');
        const dataStr = data !== undefined ? (typeof data === 'string' ? data : JSON.stringify(data, null, 2)) : '';
        fs.appendFileSync(logPath, `${logMsg} ${dataStr}\n`);
    } catch { /* ignore */ }
    if (data !== undefined) {
        console.log(`[API ${timestamp}] Data:`, typeof data === 'string' ? data : JSON.stringify(data, null, 2).slice(0, 500));
    }
};

export async function POST(request: NextRequest) {
    const startTime = Date.now();
    log('=== BACKGROUND ILLUSTRATION GENERATION STARTED ===');

    try {
        // Authenticate via internal API key
        const internalKey = request.headers.get('x-internal-key');
        if (!INTERNAL_API_KEY || !internalKey || internalKey !== INTERNAL_API_KEY) {
            log('ERROR: Unauthorized - invalid or missing internal key');
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
            log('ERROR: Missing required fields');
            return NextResponse.json({ error: 'Missing bookId or userId' }, { status: 400 });
        }

        log('Request params', { bookId, userId, artStyle, isPreview, previewPageCount });

        const db = await createAdminClient();

        // Fetch book + pages
        const { data: book, error: bookError } = await db
            .from('books')
            .select('*, pages (*)')
            .eq('id', bookId)
            .eq('user_id', userId)
            .single();

        if (bookError || !book) {
            log('ERROR: Book not found', bookError);
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
                const isAllowedOrigin = imgSrc.startsWith(supabaseUrl) || imgSrc.startsWith('data:');
                if (isAllowedOrigin) {
                    try {
                        const resp = await fetch(imgSrc);
                        if (resp.ok) {
                            const contentType = resp.headers.get('content-type') || 'image/png';
                            const contentLength = parseInt(resp.headers.get('content-length') || '0', 10);
                            if (contentLength <= 10 * 1024 * 1024) {
                                const buffer = Buffer.from(await resp.arrayBuffer());
                                styleReferenceImage = `data:${contentType};base64,${buffer.toString('base64')}`;
                                log('Loaded page 1 image as style reference from DB');
                            }
                        }
                    } catch (err) {
                        log('Failed to load style reference from DB', err);
                    }
                }
            }
        }

        // Determine max illustrations to generate
        const maxIllustrations = isPreview ? previewPageCount : pages.length;
        let generatedCount = 0;

        // Rate limit delay between images
        const SAFETY_DELAY_MS = 2000;

        for (const page of pages) {
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

            log(`Generating illustration for page ${page.page_number}...`);
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
                    log(`ERROR: Invalid image data for page ${page.page_number}`);
                    continue;
                }
                const imageBuffer = Buffer.from(matches[2], 'base64');
                const storedUrl = await uploadImageToStorage(bookId, page.page_number, imageBuffer);

                // Update this page in DB immediately
                await db
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

                // Capture first generated image as style reference
                if (generatedCount === 0 && !styleReferenceImage) {
                    styleReferenceImage = imageUrl;
                    log('Captured first generated image as style reference');
                }

                // Log generation cost
                await db.from('generation_logs').insert({
                    book_id: bookId,
                    step_name: `bg_illustration_page_${page.page_number}`,
                    model_name: usage.model,
                    input_tokens: 0,
                    output_tokens: 0,
                    image_count: 1,
                    cost_usd: 0.04,
                });

                generatedCount++;
                log(`Page ${page.page_number} completed in ${Date.now() - pageStartTime}ms (${generatedCount} total)`);

            } catch (err) {
                log(`ERROR generating page ${page.page_number}`, err);
                // Retry once
                try {
                    log(`Retrying page ${page.page_number}...`);
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
                        await db
                            .from('pages')
                            .update({
                                image_elements: [{
                                    id: crypto.randomUUID(),
                                    src: storedUrl,
                                    x: 0, y: 0, width: 100, height: 100, rotation: 0,
                                }]
                            })
                            .eq('id', page.id);
                        generatedCount++;
                        log(`Retry succeeded for page ${page.page_number}`);
                    }
                } catch (retryErr) {
                    log(`Retry also failed for page ${page.page_number}`, retryErr);
                }
            }

            // Delay between generations for rate limits
            await new Promise(r => setTimeout(r, SAFETY_DELAY_MS));
        }

        log(`=== BACKGROUND ILLUSTRATION GENERATION COMPLETE: ${generatedCount} images in ${Date.now() - startTime}ms ===`);
        return NextResponse.json({ success: true, generatedCount });

    } catch (error) {
        log('=== BACKGROUND ILLUSTRATION GENERATION FAILED ===', error);
        console.error('[generate-illustrations ERROR]', error);
        return NextResponse.json({ error: 'Failed to generate illustrations' }, { status: 500 });
    }
}
