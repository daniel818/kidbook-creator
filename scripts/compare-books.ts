
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

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

async function compareBooks() {
    const bookIds = [
        'f27c6376-dc2a-4764-8992-30572ed6205e', // User says: "original prompt did better job"
        '5a7bb6c7-0ad2-4b71-9718-ff5ee1736fcc'  // The "Fun/Silly" version I just made
    ];

    for (const id of bookIds) {
        console.log(`\n\n===============================================================`);
        console.log(`FETCHING BOOK: ${id}`);
        console.log(`===============================================================`);

        const { data: book, error } = await supabase
            .from('books')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !book) {
            console.error("Error fetching book:", error);
            continue;
        }

        console.log(`Title: ${book.title}`);
        console.log(`Child: ${book.child_name} (Age: ${book.child_age})`);
        console.log(`Created: ${book.created_at}`);
        console.log(`Theme: ${book.book_theme}`);

        // Fetch pages
        const { data: pages, error: pagesError } = await supabase
            .from('pages')
            .select('*')
            .eq('book_id', id)
            .order('page_number', { ascending: true });

        if (pagesError) {
            console.error("Error fetching pages:", pagesError);
            continue;
        }

        console.log("\n--- CONTENT PREVIEW ---");
        pages.forEach((p, i) => {
            const text = p.text_elements && p.text_elements.length > 0 ? p.text_elements[0].content : "NO TEXT";
            console.log(`[P${p.page_number}] ${text}`);
            if (i > 4) return; // Just show first few pages
        });
        if (pages.length > 5) console.log("... (truncated)");
    }
}

compareBooks();
