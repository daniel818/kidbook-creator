import dotenv from 'dotenv';
import path from 'path';

// 1. Load Environment Variables explicitly before anything else
// Using path.resolve to be sure we find .env.local in the root
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

console.log("Environment loaded from:", envPath);
console.log("API Key loaded:", process.env.GEMINI_API_KEY ? "YES (Starts with " + process.env.GEMINI_API_KEY.substring(0, 4) + ")" : "NO");

// 2. Polyfill for Node < 18 (safe to keep for mixed environments)
// @ts-ignore
import fetch from 'node-fetch';

if (!global.fetch) {
    console.log("Applying fetch polyfill for Node < 18...");
    // @ts-ignore
    global.fetch = fetch;
    // @ts-ignore
    global.Headers = fetch.Headers;
}

// 3. Define Types (re-declared locally or imported as type only to avoid side-effect import)
// We use a dynamic import for the logic, so we can just use 'any' or verify type safely if needed.
// But for this test script, we can trust the dynamic import.

async function testAge(age: number, name: string, generateStory: any) {
    console.log(`\n\n=== TESTING AGE ${age} (${name}) ===`);
    const input = {
        childName: name,
        childAge: age,
        bookTheme: 'adventure',
        bookType: 'story',
        pageCount: 3,
        storyDescription: "A simple adventure in the garden"
    };

    try {
        const { story } = await generateStory(input);
        console.log(`Title: ${story.title}`);
        console.log("--- Page 1 Text ---");
        console.log(story.pages[0].text);
        console.log("-------------------");
    } catch (e) {
        console.error("Error generating story:", e);
    }
}

async function run() {
    try {
        // Dynamic import to ensure process.env.GEMINI_API_KEY is ready BEFORE the client initializes
        console.log("Importing Gemini client...");
        const { generateStory } = await import('../lib/gemini/client');

        await testAge(2, "Baby Leo", generateStory);
        await testAge(10, "Explorer Max", generateStory);
    } catch (e) {
        console.error("Script failed:", e);
    }
}

run();
