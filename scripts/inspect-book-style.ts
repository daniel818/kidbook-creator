
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

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
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectBookStyle(bookId: string) {
    console.log(`\n=== INSPECTING BOOK STYLE: ${bookId} ===`);

    const { data: book, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single();

    if (error || !book) {
        console.error("Error fetching book:", error);
        return;
    }

    console.log(`Title: ${book.title}`);
    console.log(`Theme: ${book.book_theme}`);
    console.log(`Type: ${book.book_type}`);
    // Note: art_style might not be a column in 'books' based on previous context, but let's check input logs if possible.
    // The previous code in route.ts inserts into 'books', but didn't seem to save 'art_style' explicitly into a column named 'art_style'.
    // It saves: id, user_id, title, child_name, child_age, age_group, book_theme, book_type, print_format, status, estimated_cost.
    // So 'art_style' IS LOSSILY COMPRESSED if not saved! The generation logs might have the model but not the style prompt directly unless we infer it.
    // Wait, if art_style is not saved, we can't verify what it WAS.

    // Let's check generation_logs for the book.
    const { data: logs, error: logError } = await supabase
        .from('generation_logs')
        .select('*')
        .eq('book_id', bookId)
        .order('created_at', { ascending: true });

    if (logs && logs.length > 0) {
        console.log(`\nLog Entries: ${logs.length}`);
        logs.forEach(l => {
            // Logs don't contain the full prompt, just token counts.
        });
    }

    // Inspect Pages particularly image_elements
    const { data: pages, error: pagesError } = await supabase
        .from('pages')
        .select('*')
        .eq('book_id', bookId)
        .order('page_number', { ascending: true });

    if (pages) {
        console.log(`\nPages: ${pages.length}`);
        pages.forEach(p => {
            // @ts-ignore
            const imgSrc = p.image_elements && p.image_elements.length > 0 ? p.image_elements[0].src : "NO IMAGE";
            // @ts-ignore
            // The image prompt is NOT stored in pages table 'image_prompt' column anymore? 
            // Wait, the 'pages' table definition in init.sql had 'image_elements' JSONB.
            // It DOES NOT have an 'image_prompt' column in the schema I viewed.
            // But my inspect-latest-book.ts tried to access p.image_prompt previously and got undefined.
            // So we might have lost the image prompt data?

            // However, 'generateStory' returns pages with 'imagePrompt'.
            // In route.ts, it uses result.story.pages to populate text_elements, 
            // and result.illustrations to populate image_elements.
            // It DOES NOT save the image prompt text into the DB?

            // Check route.ts lines 249+ again.
            // It maps result.story.pages.
            // It inserts into 'pages' table.
            // keys: book_id, page_number, page_type, background_color, text_elements, image_elements.

            // It seems we DO NOT save the text of the image prompt! This makes debugging style hard.
            console.log(`[P${p.page_number}] Image Src: ${imgSrc.substring(0, 50)}...`);
        });
    }
}

inspectBookStyle('fe8df129-3ab5-4931-ab73-6b9b009bcf34');
