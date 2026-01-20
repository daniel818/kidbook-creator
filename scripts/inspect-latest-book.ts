
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

async function inspectLatestBook() {
    const { data: books, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error("Error fetching books:", error);
        return;
    }

    if (!books || books.length === 0) {
        console.log("No books found.");
        return;
    }

    const book = books[0];
    console.log(`\n=== LATEST BOOK (${book.id}) ===`);
    console.log(`Title: ${book.title}`);
    console.log(`Child Name: ${book.child_name}`);
    console.log(`Child Age: ${book.child_age}`);
    console.log(`Created At: ${book.created_at}`);

    // Fetch pages
    const { data: pages, error: pagesError } = await supabase
        .from('pages')
        .select('*')
        .eq('book_id', book.id)
        .order('page_number', { ascending: true });

    if (pagesError) {
        console.error("Error fetching pages:", pagesError);
        return;
    }

    console.log("\n--- PAGES ---");
    pages.forEach(p => {
        console.log(`\n[Page ${p.page_number}]`);
        const text = p.text_elements && p.text_elements.length > 0 ? p.text_elements[0].content : "NO TEXT";
        // @ts-ignore
        const img = p.image_elements && p.image_elements.length > 0 ? p.image_elements[0].src : "NO IMAGE";
        console.log(`Text: ${text}`);
        console.log(`Image: ${img ? img.substring(0, 50) + "..." : "none"}`);
    });
}

inspectLatestBook();
