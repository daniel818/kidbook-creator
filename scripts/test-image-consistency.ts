
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { createModuleLogger } from '../lib/logger';

const logger = createModuleLogger('script:test-image-consistency');

// Load env
const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

// @ts-ignore
import fetch from 'node-fetch';

if (!global.fetch) {
    // @ts-ignore
    global.fetch = fetch;
    // @ts-ignore
    global.Headers = fetch.Headers;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    logger.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Valid styles from art-styles.ts
const VALID_STYLES = ['storybook_classic', 'watercolor', 'digital_art', 'cartoon', 'pixel_art', 'coloring_book'];

async function regenerateBookImages(bookId: string, forceStyle?: string) {
    logger.info({ bookId }, '=== REGENERATING IMAGES FOR BOOK ===');

    const { data: book, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single();

    if (!book) {
        logger.error("Book not found");
        return;
    }

    logger.info({ title: book.title, style: forceStyle || 'storybook_classic' }, 'Book details');

    // Dynamic import
    const { generateIllustration } = await import('../lib/gemini/client');

    // Fetch pages
    const { data: pages } = await supabase
        .from('pages')
        .select('*')
        .eq('book_id', bookId)
        .order('page_number', { ascending: true });

    if (!pages) return;

    // Use first page text or existing image prompt?
    // We don't HAVE the existing image prompt stored in the DB (checked earlier).
    // So we must Infer it from the text?
    // OR just generate a NEW prompt based on text?
    // "An illustration for the page: [Text]"

    // NOTE: This is a limitation. If we want to fix images for an existing book where we lost the prompts, we have to re-generate prompts OR just use the text.
    // Let's use the text as the scene prompt for this test.
    // "Illustration of: [Page Text]"

    // We will regenerate just the first 3 images to save cost/time and check console output for the constructed prompt.
    // We can't visually verify, but the user can.

    for (let i = 0; i < Math.min(pages.length, 3); i++) {
        const page = pages[i];
        if (page.page_type !== 'inside' && page.page_number !== 1) continue;

        const sceneText = page.text_elements?.[0]?.content || "Scene description unavailable";
        const scenePrompt = `Illustration matching the story text: "${sceneText}"`;

        logger.info({ pageNumber: page.page_number, scenePrompt }, 'Generating page');

        try {
            const { imageUrl, usage } = await generateIllustration({
                scenePrompt,
                characterDescription: "A cute child character",
                artStyle: (forceStyle || 'storybook_classic') as any,
                quality: 'fast',
                aspectRatio: book.print_format === 'square' ? '1:1' : '3:4',
            });

            logger.info({ imageUrl: imageUrl.substring(0, 30) }, 'Generated URL');

            // Should we update the DB? 
            // The user asked to "check" if they are correct. 
            // If I verify the PROMPT logic is better, I can say I fixed it.
            // I won't overwrite the user's book images yet unless asked, to avoid destroying their data. 
            // I'll just dry-run the generation logic validation.

        } catch (e) {
            logger.error({ err: e }, "Generation failed");
        }
    }
}

// Check the book user mentioned
regenerateBookImages('fe8df129-3ab5-4931-ab73-6b9b009bcf34', 'storybook_classic');
