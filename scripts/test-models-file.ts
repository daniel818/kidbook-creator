
import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config'; // Loads .env file
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Load env
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("No API KEY");
    process.exit(1);
}

const genAI = new GoogleGenAI({ apiKey });

const logPath = path.join(process.cwd(), 'model_test_debug.log');
const log = (msg: string) => {
    fs.appendFileSync(logPath, msg + '\n');
    console.log(msg);
}

async function test() {
    log('--- STARTING MODEL TEST ---');

    // Test Gemini 3
    log('Testing gemini-3.0-flash-preview...');
    try {
        await genAI.models.generateContent({
            model: 'gemini-3.0-flash-preview',
            contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
        });
        log('SUCCESS: gemini-3.0-flash-preview works.');
    } catch (e: any) {
        log(`FAILED: gemini-3.0-flash-preview. Error: ${e.message} / ${JSON.stringify(e)}`);
    }

    // List Models
    log('Listing available models...');
    try {
        const response = await genAI.models.list();
        // @google/genai list() returns AsyncIterable or similar? 
        // actually SDK documentation says models.list() returns { models: ... }
        // Let's inspect it.
        // Wait, SDK syntax for list might be different. 
        // Let's try standard list.
        const listResp = await genAI.models.list();
        // It might be paginated.
        for await (const model of listResp) {
            log(`Model: ${JSON.stringify(model)}`);
        }
    } catch (e: any) {
        log(`List failed: ${e.message}`);
    }

    // Test Imagen 4

    log('Testing imagen-4.0-generate-001...');
    try {
        await genAI.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: 'A cat',
            config: { numberOfImages: 1 }
        });
        log('SUCCESS: imagen-4.0-generate-001 works.');
    } catch (e: any) {
        log(`FAILED: imagen-4.0-generate-001. Error: ${e.message} / ${JSON.stringify(e)}`);
    }
}

test();
