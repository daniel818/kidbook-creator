
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config'; // Loads .env file
import dotenv from 'dotenv';
import { createModuleLogger } from '../lib/logger';

dotenv.config({ path: '.env.local' });

const logger = createModuleLogger('script:test-models-file');

// Load env
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    logger.error("No API KEY");
    process.exit(1);
}

const genAI = new GoogleGenAI({ apiKey });

async function test() {
    logger.info('--- STARTING MODEL TEST ---');

    // Test Gemini 3
    logger.info('Testing gemini-3.0-flash-preview...');
    try {
        await genAI.models.generateContent({
            model: 'gemini-3.0-flash-preview',
            contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
        });
        logger.info('SUCCESS: gemini-3.0-flash-preview works.');
    } catch (e: any) {
        logger.error({ err: e }, 'FAILED: gemini-3.0-flash-preview');
    }

    // List Models
    logger.info('Listing available models...');
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
            logger.info({ model }, 'Model');
        }
    } catch (e: any) {
        logger.error({ err: e }, 'List failed');
    }

    // Test Imagen 4

    logger.info('Testing imagen-4.0-generate-001...');
    try {
        await genAI.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: 'A cat',
            config: { numberOfImages: 1 }
        });
        logger.info('SUCCESS: imagen-4.0-generate-001 works.');
    } catch (e: any) {
        logger.error({ err: e }, 'FAILED: imagen-4.0-generate-001');
    }
}

test();
