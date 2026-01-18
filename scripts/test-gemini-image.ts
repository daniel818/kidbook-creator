
import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) { console.error("No Key"); process.exit(1); }

const genAI = new GoogleGenAI({ apiKey });

const logFile = path.join(process.cwd(), 'gemini_image_test.log');
const log = (msg: string) => {
    fs.appendFileSync(logFile, msg + '\n');
    console.log(msg);
}

async function testGeminiImage() {
    log("--- TESTING GEMINI 3 PRO IMAGE PREVIEW ---");
    const model = 'gemini-3-pro-image-preview';

    // Test 1: generateContent (Does it output images?)
    log("\nTest 1: generateContent asking for image...");
    try {
        const response = await genAI.models.generateContent({
            model: model,
            contents: [{ role: 'user', parts: [{ text: "Draw a cute cat." }] }]
        });
        log("Response Parts: " + JSON.stringify(response.candidates?.[0]?.content?.parts));
    } catch (e: any) {
        log("generateContent Failed: " + e.message);
    }

    // Test 2: generateImages with this model
    log("\nTest 2: generateImages with gemini-3 model...");
    try {
        const response = await genAI.models.generateImages({
            model: model,
            prompt: "A cute cat",
            config: { numberOfImages: 1 }
        });
        log("generateImages Success: " + !!response.generatedImages?.[0]);
    } catch (e: any) {
        log("generateImages Failed: " + e.message);
    }
}

testGeminiImage();
