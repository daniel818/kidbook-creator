
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';
import dotenv from 'dotenv';
import { createModuleLogger } from '../lib/logger';

dotenv.config({ path: '.env.local' });

const logger = createModuleLogger('script:test-gemini-image');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) { logger.error("No Key"); process.exit(1); }

const genAI = new GoogleGenAI({ apiKey });

async function testGeminiImage() {
    logger.info("--- TESTING GEMINI 3 PRO IMAGE PREVIEW ---");
    const model = 'gemini-3-pro-image-preview';

    // Test 1: generateContent (Does it output images?)
    logger.info("Test 1: generateContent asking for image...");
    try {
        const response = await genAI.models.generateContent({
            model: model,
            contents: [{ role: 'user', parts: [{ text: "Draw a cute cat." }] }]
        });
        logger.info({ parts: response.candidates?.[0]?.content?.parts }, "Response Parts");
    } catch (e: any) {
        logger.error({ err: e }, "generateContent Failed");
    }

    // Test 2: generateImages with this model
    logger.info("Test 2: generateImages with gemini-3 model...");
    try {
        const response = await genAI.models.generateImages({
            model: model,
            prompt: "A cute cat",
            config: { numberOfImages: 1 }
        });
        logger.info({ success: !!response.generatedImages?.[0] }, "generateImages result");
    } catch (e: any) {
        logger.error({ err: e }, "generateImages Failed");
    }
}

testGeminiImage();
