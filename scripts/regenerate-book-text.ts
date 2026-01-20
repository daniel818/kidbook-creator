
import crypto from 'crypto';
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

async function regenerateBookText(bookId: string) {
    console.log(`\n=== REGENERATING TEXT FOR BOOK: ${bookId} ===`);

    // 1. Fetch Book Details
    const { data: book, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single();

    if (error || !book) {
        console.error("Error fetching book:", error);
        return;
    }

    console.log(`Found Book: "${book.title}" (Child: ${book.child_name}, Age: ${book.child_age})`);

    // 2. Fetch Page Count (to ensure we match)
    const { count, error: countError } = await supabase
        .from('pages')
        .select('*', { count: 'exact', head: true })
        .eq('book_id', bookId)
        .eq('page_type', 'inside'); // Only count inside pages for generation logic usually

    if (countError) {
        console.error("Error counting pages:", countError);
        return;
    }

    // Dynamic Import to ensure Env is loaded
    const { generateStory } = await import('../lib/gemini/client');

    const input = {
        childName: book.child_name,
        childAge: book.child_age,
        bookTheme: book.book_theme,
        bookType: book.book_type,
        pageCount: count || 5,
        storyDescription: `(Regenerated) A story about ${book.book_theme}` // We might miss the original custom user prompt if it wasn't saved in 'storyDescription' column separately or if it was implicit.
        // NOTE: The DB schema has 'book_theme' but not a detailed 'user_prompt' column visible in my header check. 
        // I will assume the theme and child details are sufficient, or genericize.
    };

    console.log("Generating new story text with UPDATED guidelines...");
    try {
        const { story } = await generateStory(input);
        console.log(`Generated Title: "${story.title}"`);

        // 3. Update Pages
        console.log("Updating database pages...");

        // We need to iterate through existing pages and update them one by one to match page numbers
        const { data: existingPages } = await supabase
            .from('pages')
            .select('*')
            .eq('book_id', bookId)
            .order('page_number', { ascending: true });

        if (!existingPages) return;

        let updateCount = 0;
        for (let i = 0; i < existingPages.length; i++) {
            const page = existingPages[i];

            // Map generated content to page
            // Note: generateStory returns pages 1..N. existingPages has covers etc.
            // My generateStory output format: { pageNumber: 1, text: "...", ... }

            // Simple mapping logic: 
            // If page_type is 'inside', try to map to story.pages[0..N]
            // If page_type is 'cover', maybe use title?

            let newText = "";
            let newImagePrompt = ""; // Optional: store this if we had a column, but we store in text_elements/image_elements

            if (page.page_type === 'inside') {
                // Find matching story page. story.pages are 1-indexed usually in content
                // But let's look at the array index.
                // We need to match the "inside page index".
                // Let's filter existingPages to just inside to find the index.
                const insideIndex = existingPages.filter(p => p.page_type === 'inside' && p.page_number <= page.page_number).length - 1;

                if (story.pages[insideIndex]) {
                    newText = story.pages[insideIndex].text;
                }
            } else if (page.page_type === 'cover' || page.page_number === 1) {
                // Sometimes page 1 is cover.
                // Let's just assume we update the text if we have it?
                // Actually, the user complained about the STORY text.
                continue; // Skip cover for now unless requested
            }

            if (newText) {
                // Construct new text_elements JSON
                const newTextElements = [{
                    id: crypto.randomUUID(), // New ID or keep old? New is safer.
                    content: newText,
                    x: 10, y: 70, width: 80, fontSize: 18,
                    fontFamily: 'Inter', color: '#333333', textAlign: 'center', fontWeight: 'normal'
                }];

                const { error: updateError } = await supabase
                    .from('pages')
                    .update({
                        text_elements: newTextElements
                    })
                    .eq('id', page.id);

                if (updateError) {
                    console.error(`Failed to update page ${page.page_number}`, updateError);
                } else {
                    console.log(`Updated Page ${page.page_number}: "${newText.substring(0, 30)}..."`);
                    updateCount++;
                }
            }
        }

        // Also update title if changed
        if (story.title) {
            await supabase.from('books').update({ title: story.title }).eq('id', bookId);
            console.log("Updated Book Title");
        }

        console.log(`SUCCESS: Updated ${updateCount} pages.`);

    } catch (e) {
        console.error("Regeneration failed:", e);
    }
}

// Run for the specific ID
regenerateBookText('5a7bb6c7-0ad2-4b71-9718-ff5ee1736fcc');
