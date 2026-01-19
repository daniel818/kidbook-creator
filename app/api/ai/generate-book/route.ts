// ============================================
// Complete Book Generation API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateCompleteBook, StoryGenerationInput } from '@/lib/gemini/client';
import * as fs from 'fs';
import * as path from 'path';

// Helper function for logging with timestamps
const log = (message: string, data?: unknown) => {
    const timestamp = new Date().toISOString();
    const logMsg = `[API generate-book ${timestamp}] ${message}`;
    console.log(logMsg);

    // Also write to file for deeper debugging
    try {
        const logPath = path.join(process.cwd(), 'api_debug.log');
        const dataStr = data !== undefined ? (typeof data === 'string' ? data : JSON.stringify(data, null, 2)) : '';
        fs.appendFileSync(logPath, `${logMsg} ${dataStr}\n`);
    } catch (e) {
        // ignore write error
    }

    if (data !== undefined) {
        console.log(`[API ${timestamp}] Data:`, typeof data === 'string' ? data : JSON.stringify(data, null, 2).slice(0, 500));
    }
};

export async function POST(request: NextRequest) {
    const requestStartTime = Date.now();
    log('========================================');
    log('=== GENERATE-BOOK API REQUEST STARTED ===');
    log('========================================');

    try {
        log('Step 1: Parsing request body...');
        const body = await request.json();
        const { childName, childAge, bookTheme, bookType, pageCount, characterDescription, storyDescription, artStyle, imageQuality, childPhoto, printFormat } = body;
        log('Request body parsed', { childName, childAge, bookTheme, bookType, artStyle, imageQuality, hasPhoto: !!childPhoto, printFormat });

        if (!childName || !bookTheme || !bookType) {
            log('ERROR: Missing required fields');
            return NextResponse.json(
                { error: 'Missing required fields: childName, bookTheme, bookType' },
                { status: 400 }
            );
        }

        // Authenticate User
        log('Step 2: Authenticating user...');
        const authStartTime = Date.now();
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        log(`Authentication completed in ${Date.now() - authStartTime}ms`);

        if (authError || !user) {
            log('ERROR: Unauthorized', authError);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        log(`User authenticated: ${user.id}`);

        // Determine aspect ratio from print format
        let aspectRatio: '1:1' | '3:4' = '3:4';
        if (printFormat === 'square' || printFormat?.includes('square')) {
            aspectRatio = '1:1';
        }
        log(`Selected Aspect Ratio: ${aspectRatio} (Format: ${printFormat})`);

        const input: StoryGenerationInput = {
            childName,
            childAge: childAge || 5,
            bookTheme,
            bookType,
            pageCount: pageCount || 10,
            characterDescription,
            storyDescription,
            artStyle: artStyle || 'storybook_classic',
            imageQuality: imageQuality || 'fast',
            childPhoto,
            aspectRatio,
        };

        // Generate the complete book (story + illustrations)
        log('Step 3: Starting book generation...');
        const genStartTime = Date.now();
        const result = await generateCompleteBook(input);
        log(`Book generation completed in ${Date.now() - genStartTime}ms`);
        log(`Generated: ${result.story.pages.length} pages, ${result.illustrations.filter(i => i).length} images`);

        // Identifiers
        const userId = user.id;
        const bookId = crypto.randomUUID();
        log(`Created bookId: ${bookId}`);

        // ---------------------------------------------------------
        // IMAGE UPLOAD LOGIC
        // ---------------------------------------------------------
        log('Step 4: Processing and uploading images...');
        const uploadStartTime = Date.now();
        let uploadedCount = 0;

        // Helper to upload base64
        const uploadBase64 = async (base64Str: string, filename: string) => {
            if (!base64Str || base64Str.length < 100) return null;
            try {
                const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    const contentType = matches[1];
                    const buffer = Buffer.from(matches[2], 'base64');
                    log(`Uploading ${Math.round(buffer.length / 1024)}KB as ${filename}`);

                    const { error: uploadError } = await supabase.storage
                        .from('book-images')
                        .upload(filename, buffer, { contentType, upsert: true });

                    if (uploadError) {
                        log(`Upload FAILED for ${filename}`, uploadError.message);
                        return null;
                    }
                    const { data: { publicUrl } } = supabase.storage
                        .from('book-images')
                        .getPublicUrl(filename);
                    return publicUrl;
                }
            } catch (e) {
                log(`Processing ERROR for ${filename}`, e);
            }
            return null;
        };

        // 1. Upload Story Illustrations
        for (let i = 0; i < result.illustrations.length; i++) {
            const publicUrl = await uploadBase64(result.illustrations[i], `${userId}/${bookId}/${i}.png`);
            if (publicUrl) {
                result.illustrations[i] = publicUrl;
                uploadedCount++;
            }
        }

        // 2. Upload Back Cover Image
        let backCoverUrl = '';
        if (result.backCoverImage) {
            const url = await uploadBase64(result.backCoverImage, `${userId}/${bookId}/back_cover.png`);
            if (url) backCoverUrl = url;
        }

        log(`Image upload complete: ${uploadedCount} images + back cover in ${Date.now() - uploadStartTime}ms`);

        const getAgeGroup = (age: number) => {
            if (age <= 2) return '0-2';
            if (age <= 5) return '3-5';
            if (age <= 8) return '6-8';
            return '9-12';
        };

        // Insert into Database
        log('Step 5: Saving to database...');
        const dbStartTime = Date.now();

        const { error: dbError } = await supabase.from('books').insert({
            id: bookId,
            user_id: userId,
            title: result.story.title,
            child_name: childName,
            child_age: childAge,
            age_group: getAgeGroup(childAge || 5),
            book_theme: bookTheme,
            book_type: bookType,
            print_format: aspectRatio === '1:1' ? 'square' : 'portrait',
            status: 'draft',
        });

        if (dbError) {
            log('ERROR: Database insert failed', dbError);
            throw dbError;
        }
        log(`Book record saved in ${Date.now() - dbStartTime}ms`);

        const pagesData = result.story.pages.map((page, index) => ({
            book_id: bookId,
            page_number: page.pageNumber,
            page_type: page.pageNumber === 1 ? 'cover' : 'inside',
            background_color: '#ffffff',
            text_elements: page.text ? [{
                id: crypto.randomUUID(),
                content: page.text,
                x: 10, y: 70, width: 80, fontSize: 18,
                fontFamily: 'Inter', color: '#333333', textAlign: 'center', fontWeight: 'normal'
            }] : [],
            image_elements: result.illustrations[index] ? [{
                id: crypto.randomUUID(),
                src: result.illustrations[index],
                x: 0, y: 0, width: 100, height: 100,
                rotation: 0
            }] : []
        }));

        // Add Back Cover Page
        if (result.story.backCoverBlurb || backCoverUrl) {
            pagesData.push({
                book_id: bookId,
                page_number: pagesData.length + 1,
                page_type: 'back',
                background_color: '#ffffff',
                text_elements: result.story.backCoverBlurb ? [{
                    id: crypto.randomUUID(),
                    content: result.story.backCoverBlurb,
                    x: 15, y: 30, width: 70, fontSize: 14,
                    fontFamily: 'Inter', color: '#000000', textAlign: 'center', fontWeight: 'normal'
                }] : [],
                image_elements: backCoverUrl ? [{
                    id: crypto.randomUUID(),
                    src: backCoverUrl,
                    x: 0, y: 0, width: 100, height: 100,
                    rotation: 0
                }] : []
            });
        }

        log(`Saving ${pagesData.length} pages to database...`);
        const pagesStartTime = Date.now();
        const { error: pagesError } = await supabase.from('pages').insert(pagesData);

        if (pagesError) {
            log('ERROR: Pages insert failed', pagesError);
            throw pagesError;
        }
        log(`Pages saved in ${Date.now() - pagesStartTime}ms`);

        const totalDuration = Date.now() - requestStartTime;
        log('========================================');
        log(`=== GENERATE-BOOK API REQUEST COMPLETE in ${totalDuration}ms ===`);
        log('========================================');

        return NextResponse.json({
            success: true,
            bookId: bookId
        });

    } catch (error) {
        const totalDuration = Date.now() - requestStartTime;
        log('========================================');
        log(`=== GENERATE-BOOK API REQUEST FAILED after ${totalDuration}ms ===`);
        log('========================================');
        console.error('[API generate-book ERROR]', error);
        return NextResponse.json(
            { error: 'Failed to generate book' },
            { status: 500 }
        );
    }
}
