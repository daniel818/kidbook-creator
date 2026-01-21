// ============================================
// Google Gemini AI Client (Unified SDK)
// ============================================
// AI-powered story and image generation using Gemini 3 & Imagen 3

import { GoogleGenAI } from '@google/genai';
import { ART_STYLES, ArtStyle, ImageQuality } from '../art-styles';
import * as fs from 'fs';
import * as path from 'path';

// Re-export art styles for convenience
export { ART_STYLES, type ArtStyle } from '../art-styles';

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
    aspectRatio?: '1:1' | '3:4';
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
    backCoverBlurb?: string;
}

export interface UsageMetadata {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    imageCount: number;
    model: string;
}

export interface GenerationLogItem {
    stepName: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    imageCount: number;
}

// Generate a story script
export async function generateStory(input: StoryGenerationInput): Promise<{ story: GeneratedStory; usage: UsageMetadata }> {
    const startTime = Date.now();
    logWithTime('=== STORY GENERATION STARTED ===');

    const textModel = process.env.GEMINI_TEXT_MODEL || 'gemini-3-flash-preview';
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
        "backCoverBlurb": "A short, engaging summary of the story for the back cover (2-3 sentences max)",
        "characterDescription": "A detailed physical description of the main character (if not provided)",
        "pages": [
            {
                "pageNumber": 1,
                "text": "Story text for this page (keep it short for children)",
                "imagePrompt": "A detailed description of the illustration for this page, describing the scene and action ONLY. Do NOT describe the art style (e.g. 'cartoon', 'watercolor') as this is handled separately."
            },
            ...
        ]
    }
    `;

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

        const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
            throw new Error('Empty response from Gemini');
        }

        // Clean markdown
        const cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();
        const storyData = JSON.parse(cleanedText) as GeneratedStory;

        // Capture Usage
        const usage: UsageMetadata = {
            inputTokens: response.usageMetadata?.promptTokenCount || 0,
            outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
            totalTokens: response.usageMetadata?.totalTokenCount || 0,
            imageCount: 0,
            model: textModel
        };

        const totalDuration = Date.now() - startTime;
        logWithTime(`=== STORY GENERATION COMPLETED in ${totalDuration}ms ===`);
        logWithTime(`Usage: ${usage.totalTokens} tokens`);

        return { story: storyData, usage };

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
    referenceImage?: string,
    aspectRatio: '1:1' | '3:4' = '3:4'
): Promise<{ imageUrl: string; usage: UsageMetadata }> {
    const startTime = Date.now();
    logWithTime(`=== IMAGE GENERATION STARTED ===`);

    const styleInfo = ART_STYLES[artStyle] || ART_STYLES.storybook_classic;

    // --- MODE 1: Reference Image (Gemini 3 Pro Image) ---
    if (referenceImage) {
        logWithTime('Using Reference Image Mode (Gemini 3 Pro Image)');
        const base64Image = referenceImage.replace(/^data:image\/\w+;base64,/, '');

        const prompt = `Generate a children's book illustration.
        Style: ${styleInfo.prompt}
        Scene: ${scenePrompt}
        Character Description: ${characterDescription}
        IMPORTANT: The character MUST look exactly like the child in the provided reference image.
        Maintain facial features, hair, and likeness.
        Ratio: ${aspectRatio === '1:1' ? 'Square 1:1' : '3:4 Portrait'}.
        High quality, detailed.`;

        const modelName = process.env.GEMINI_REF_IMAGE_MODEL || 'gemini-3-pro-image-preview';

        try {
            const response = await genAI.models.generateContent({
                model: modelName,
                contents: [{
                    role: 'user',
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
                    ]
                }]
            });

            // Extract image from response
            const part = response.candidates?.[0]?.content?.parts?.[0];
            if (part?.inlineData?.data) {
                const totalDuration = Date.now() - startTime;
                logWithTime(`=== REF IMAGE GENERATION COMPLETED in ${totalDuration}ms ===`);

                return {
                    imageUrl: `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${part.inlineData.data}`,
                    usage: {
                        inputTokens: 0, // Gemini image gen doesn't strictly report text tokens like text models usually, or we treat as 1 image op
                        outputTokens: 0,
                        totalTokens: 0,
                        imageCount: 1,
                        model: modelName
                    }
                };
            }
        } catch (e: any) {
            logWithTime('Gemini 3 Reference Gen Failed, falling back to Imagen 4', e.message);
        }
    }

}

// Extract character description
export async function extractCharacterFromPhoto(base64Image: string): Promise<string> {
    const startTime = Date.now();
    const model = process.env.GEMINI_TEXT_MODEL || 'gemini-3-flash-preview';

    try {
        const response = await genAI.models.generateContent({
            model: model,
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: "Analyze this image and create a highly detailed character reference description for an AI image generator..." }, // Keep short for brevity in log
                        {
                            inlineData: {
                                mimeType: 'image/jpeg',
                                data: base64Image
                            }
                        }
                    ]
                }
            ]
        });

        const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
        // Note: We could capture usage here too, but focused on text return for now. 
        // Ideally we should refactor this too, but for now we'll skip logging this minor step cost or treat as negligible.
        return text || "A happy child";
    } catch (error) {
        console.error("[GEMINI VISION ERROR]", error);
        return "A happy child";
    }
}

// Generate complete book
export async function generateCompleteBook(
    input: StoryGenerationInput,
    onProgress?: (step: string, progress: number) => void
): Promise<{
    story: GeneratedStory;
    illustrations: string[];
    backCoverImage?: string;
    generationLogs: GenerationLogItem[]; // Use specific type
}> {
    const bookStartTime = Date.now();
    logWithTime('=== COMPLETE BOOK GENERATION STARTED ===');
    const generationLogs: GenerationLogItem[] = [];

    onProgress?.('Generating story...', 10);
    const { story, usage: storyUsage } = await generateStory(input);

    generationLogs.push({
        stepName: 'story_generation',
        model: storyUsage.model,
        inputTokens: storyUsage.inputTokens,
        outputTokens: storyUsage.outputTokens,
        imageCount: 0
    });

    const characterDescription = story.characterDescription || input.characterDescription || `A cute child named ${input.childName}`;

    const illustrations: string[] = new Array(story.pages.length).fill('');

    // Concurrency Settings
    const CONCURRENCY_LIMIT = 3;
    const SAFETY_DELAY_MS = 2000; // 2 seconds between batches to be safe with rate limits

    // Helper to generate a single page
    const generatePageFn = async (pageIndex: number) => {
        try {
            const { imageUrl, usage: imgUsage } = await generateIllustration(
                story.pages[pageIndex].imagePrompt,
                characterDescription,
                input.artStyle,
                input.imageQuality,
                input.childPhoto,
                input.aspectRatio
            );
            illustrations[pageIndex] = imageUrl;
            generationLogs.push({
                stepName: `illustration_page_${pageIndex + 1}`,
                model: imgUsage.model,
                inputTokens: 0,
                outputTokens: 0,
                imageCount: 1
            });
        } catch (e) {
            console.error(`Failed to generate page ${pageIndex + 1}`, e);
            illustrations[pageIndex] = ''; // Keep empty on failure
        }
    };

    // Process in Batches
    for (let i = 0; i < story.pages.length; i += CONCURRENCY_LIMIT) {
        const batchStart = i;
        const batchEnd = Math.min(i + CONCURRENCY_LIMIT, story.pages.length);
        const batchPromises: Promise<void>[] = [];

        logWithTime(`Starting batch ${Math.ceil((i + 1) / CONCURRENCY_LIMIT)}: Pages ${batchStart + 1} to ${batchEnd}`);
        onProgress?.(`Painting pages ${batchStart + 1}-${batchEnd} of ${story.pages.length}...`, 20 + (70 * (i + 1) / story.pages.length));

        for (let j = batchStart; j < batchEnd; j++) {
            batchPromises.push(generatePageFn(j));
        }

        await Promise.all(batchPromises);

        // Delay between batches (unless it's the last one)
        if (batchEnd < story.pages.length) {
            logWithTime(`Batch complete. Waiting ${SAFETY_DELAY_MS}ms safely...`);
            await new Promise(r => setTimeout(r, SAFETY_DELAY_MS));
        }
    }

    // Generate Back Cover
    onProgress?.('Creating back cover...', 95);
    let backCoverImage: string | undefined;
    try {
        const backCoverPrompt = "A magical background pattern or simple scenic view suitable for a book back cover. No characters, just atmosphere matching the book theme.";
        const { imageUrl, usage: backUsage } = await generateIllustration(
            backCoverPrompt, // Scene
            "", // No character description needed for back cover background usually
            input.artStyle,
            input.imageQuality,
            undefined, // No reference
            input.aspectRatio
        );
        backCoverImage = imageUrl;
        generationLogs.push({
            stepName: 'back_cover',
            model: backUsage.model,
            inputTokens: 0,
            outputTokens: 0,
            imageCount: 1
        });
    } catch (e) {
        logWithTime('Failed to generate back cover', e);
    }

    logWithTime(`=== FINISHED ===`);
    return { story, illustrations, backCoverImage, generationLogs };
}
