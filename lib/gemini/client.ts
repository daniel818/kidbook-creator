// ============================================
// Google Gemini AI Client (Unified SDK)
// ============================================
// AI-powered story and image generation using Gemini 3 & Imagen 3

import { GoogleGenAI } from '@google/genai';
import { ART_STYLES, ArtStyle, ImageQuality } from '../art-styles';
import * as fs from 'fs';
import * as path from 'path';

// Re-export art styles for convenience
export { ART_STYLES, type ArtStyle } from '@/lib/art-styles';

// Helper function for logging with timestamps
const logWithTime = (message: string, data?: unknown) => {
    const timestamp = new Date().toISOString();
    const logMsg = `[GEMINI ${timestamp}] ${message}`;
    console.log(logMsg);

    try {
        const logPath = path.join(process.cwd(), 'api_debug.log');
        const dataStr = data !== undefined ? (typeof data === 'string' ? data : JSON.stringify(data, null, 2)) : '';
        fs.appendFileSync(logPath, `${logMsg} ${dataStr}\n`);
    } catch (e) { }

    if (data !== undefined) {
        console.log(`[GEMINI ${timestamp}] Data:`, JSON.stringify(data, null, 2).slice(0, 500));
    }
};

// Initialize Gemini client (server-side only)
logWithTime('Initializing Gemini Unified client (@google/genai)...');
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
logWithTime('Gemini client initialized');

export interface StoryGenerationInput {
    childName: string;
    childAge: number;
    bookTheme: string;
    bookType: string;
    pageCount?: number;
    characterDescription?: string;
    storyDescription?: string;
    artStyle?: ArtStyle;
    imageQuality?: ImageQuality;
    childPhoto?: string;
}

export interface GeneratedPage {
    pageNumber: number;
    title?: string;
    text: string;
    imagePrompt: string;
}

export interface GeneratedStory {
    title: string;
    pages: GeneratedPage[];
    characterDescription?: string;
}

// Generate a story script
export async function generateStory(input: StoryGenerationInput): Promise<GeneratedStory> {
    const startTime = Date.now();
    logWithTime('=== STORY GENERATION STARTED ===');

    // Use Gemini 3.0 Flash Preview (The absolute latest)
    // Confirmed name via API list: 'gemini-3-flash-preview' (no .0)
    const textModel = 'gemini-3-flash-preview';
    logWithTime(`Using model: ${textModel}`);

    const prompt = `
    Create a children's book story based on the following details:
    - Child's Name: ${input.childName}
    - Age: ${input.childAge}
    - Theme: ${input.bookTheme}
    - Type: ${input.bookType}
    - Page Count: ${input.pageCount || 10}
    ${input.characterDescription ? `- Character Description: ${input.characterDescription}` : ''}
    ${input.storyDescription ? `- Specific Story Request: ${input.storyDescription}` : ''}

    The story should be engaging, age-appropriate, and magical.
    
    OUTPUT FORMAT:
    Return ONLY a valid JSON object with the following structure:
    {
        "title": "Title of the book",
        "characterDescription": "A detailed physical description of the main character (if not provided)",
        "pages": [
            {
                "pageNumber": 1,
                "text": "Story text for this page (keep it short for children)",
                "imagePrompt": "A detailed description of the illustration for this page, describing the scene and action"
            },
            ...
        ]
    }
    `;

    // Log the full prompt for user inspection
    logWithTime('--- STORY PROMPT SENT TO MODEL ---', prompt);

    try {
        logWithTime('Sending request to Gemini API...');

        const response = await genAI.models.generateContent({
            model: textModel,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                responseMimeType: 'application/json'
            }
        });

        // @google/genai syntax: response.candidates[0].content.parts[0].text
        const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
            throw new Error('Empty response from Gemini');
        }

        // Clean markdown
        const cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();
        const storyData = JSON.parse(cleanedText) as GeneratedStory;

        const totalDuration = Date.now() - startTime;
        logWithTime(`=== STORY GENERATION COMPLETED in ${totalDuration}ms ===`);
        return storyData;

    } catch (error) {
        console.error('[GEMINI ERROR]', error);
        throw error;
    }
}

// Generate an illustration using Gemini/Imagen
export async function generateIllustration(
    scenePrompt: string,
    characterDescription: string,
    artStyle: ArtStyle = 'storybook_classic',
    quality: ImageQuality = 'fast',
    referenceImage?: string
): Promise<string> {
    const startTime = Date.now();
    logWithTime(`=== IMAGE GENERATION STARTED ===`);

    const styleInfo = ART_STYLES[artStyle] || ART_STYLES.storybook_classic;

    // --- MODE 1: Reference Image (Gemini 3 Pro Image) ---
    if (referenceImage) {
        logWithTime('Using Reference Image Mode (Gemini 3 Pro Image)');
        // Remove data URI prefix if present for API
        const base64Image = referenceImage.replace(/^data:image\/\w+;base64,/, '');

        const prompt = `Generate a children's book illustration.
        Style: ${styleInfo.prompt}
        Scene: ${scenePrompt}
        Character Description: ${characterDescription}
        IMPORTANT: The character MUST look exactly like the child in the provided reference image.
        Maintain facial features, hair, and likeness.
        Ratio: 3:4 Portrait.
        High quality, detailed.`;

        try {
            const response = await genAI.models.generateContent({
                model: 'gemini-3-pro-image-preview',
                contents: [{
                    role: 'user',
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
                    ]
                }],
                config: {
                    // Force image generation via config if needed or implied by model
                    // For gemini-3-image, output is image.
                }
            });

            // Extract image from response
            const part = response.candidates?.[0]?.content?.parts?.[0];
            if (part?.inlineData?.data) {
                const totalDuration = Date.now() - startTime;
                logWithTime(`=== REF IMAGE GENERATION COMPLETED in ${totalDuration}ms ===`);
                return `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${part.inlineData.data}`;
            }
            logWithTime('No inlineData in Gemini 3 response, checking text?');
        } catch (e: any) {
            logWithTime('Gemini 3 Reference Gen Failed, falling back to Imagen 4', e.message);
        }
    }

    // --- MODE 2: Standard Text-to-Image (Imagen 4) ---
    logWithTime(`Using Standard Mode (Imagen 4)`);
    const fullPrompt = `Create a children's book illustration.
    Style: ${styleInfo.prompt}
    Character: ${characterDescription}
    Scene: ${scenePrompt}
    High quality, vibrant, detailed, 3:4 portrait ratio.`;

    // Use Imagen 4 models
    // Fast/Standard -> imagen-4.0-generate-001
    // Pro -> imagen-4.0-generate-ultra-001
    const imageModel = quality === 'pro' ? 'imagen-4.0-generate-ultra-001' : 'imagen-4.0-generate-001';
    logWithTime(`Using model: ${imageModel}`);

    try {
        const response = await genAI.models.generateImages({
            model: imageModel,
            prompt: fullPrompt,
            config: {
                numberOfImages: 1,
                aspectRatio: '3:4',
                // outputMimeType: 'image/jpeg' ? Default is usually png/jpeg
            }
        });

        // Response structure for generateImages:
        // response.generatedImages[0].image.imageBytes (base64 string)
        const image = response.generatedImages?.[0]?.image;

        if (image?.imageBytes) {
            const totalDuration = Date.now() - startTime;
            logWithTime(`=== IMAGE GENERATION COMPLETED in ${totalDuration}ms ===`);
            // Format needs to be data URL
            return `data:image/png;base64,${image.imageBytes}`;
        } else {
            throw new Error('No image returned');
        }

    } catch (e: any) {
        // Fallback or detailed error logging
        console.error('[IMAGEN ERROR]', e);

        // If Model Not Found (404), maybe user doesn't have access to Imagen 3?
        // Fallback to Gemini 2.0 Flash generating text describing image? No.
        throw e;
    }
}

// Extract character description
export async function extractCharacterFromPhoto(base64Image: string): Promise<string> {
    const startTime = Date.now();
    // Gemini 2.0 Flash is great for vision
    const model = 'gemini-3-flash-preview';

    try {
        const response = await genAI.models.generateContent({
            model: model,
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: "Analyze this image and create a highly detailed character reference description for an AI image generator. Focus on: 1. Exact hair color, texture, length, and style. 2. Eye color, shape, and lash details. 3. Face shape, cheekbones, and jawline. 4. Nose shape and mouth/smile details. 5. Skin tone and complexion. 6. Distinctive markings (freckles, dimples). Focus strictly on facial features and headshot details to ensure a perfect likeness." },
                        {
                            inlineData: {
                                mimeType: 'image/jpeg',
                                data: base64Image // Provide raw base64 data? SDK might expect specific format.
                                // @google/genai inlineData expects 'data' as base64 string.
                            }
                        }
                    ]
                }
            ]
        });

        const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
        return text || "A happy child";
    } catch (error) {
        console.error("[GEMINI VISION ERROR]", error);
        return "A happy child";
    }
}

// Generate complete book
// ... (Keep same logic, just imports changed)
export async function generateCompleteBook(
    input: StoryGenerationInput,
    onProgress?: (step: string, progress: number) => void
): Promise<{ story: GeneratedStory; illustrations: string[] }> {
    // ... same implementation as before ...
    const bookStartTime = Date.now();
    logWithTime('=== COMPLETE BOOK GENERATION STARTED ===');

    onProgress?.('Generating story...', 10);
    const story = await generateStory(input);
    const characterDescription = story.characterDescription || input.characterDescription || `A cute child named ${input.childName}`;

    const illustrations: string[] = [];
    for (let i = 0; i < story.pages.length; i++) {
        onProgress?.(`Painting page ${i + 1}...`, 20 + (80 * i / story.pages.length));
        try {
            const img = await generateIllustration(
                story.pages[i].imagePrompt,
                characterDescription,
                input.artStyle,
                input.imageQuality,
                input.childPhoto
            );
            illustrations.push(img);
        } catch (e) {
            console.error(e);
            illustrations.push('');
        }
        if (i < story.pages.length - 1) await new Promise(r => setTimeout(r, 1000));
    }

    logWithTime(`=== FINISHED ===`);
    return { story, illustrations };
}
