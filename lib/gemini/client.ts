// ============================================
// Google Gemini AI Client (Unified SDK)
// ============================================
// AI-powered story and image generation using Gemini 3 & Imagen 3

import { GoogleGenAI } from '@google/genai';
import { ART_STYLES, ArtStyle, ImageQuality } from '../art-styles';
import { getPrompts, Language } from './prompts';
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
    language?: Language;
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

    const language = input.language || 'en';
    const textModel = process.env.GEMINI_TEXT_MODEL || 'gemini-3-flash-preview';
    logWithTime(`Using model: ${textModel}, language: ${language}`);

    const prompts = getPrompts(language);
    const prompt = prompts.getStoryPrompt({
        childName: input.childName,
        childAge: input.childAge,
        bookTheme: input.bookTheme,
        bookType: input.bookType,
        pageCount: input.pageCount || 10,
        characterDescription: input.characterDescription,
        storyDescription: input.storyDescription
    });

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

// Generate an illustration using Gemini
export async function generateIllustration(
    scenePrompt: string,
    characterDescription: string,
    artStyle: ArtStyle = 'storybook_classic',
    quality: ImageQuality = 'fast',
    referenceImage?: string,
    aspectRatio: '1:1' | '3:4' = '3:4',
    language: Language = 'en'
): Promise<{ imageUrl: string; usage: UsageMetadata }> {
    const startTime = Date.now();
    logWithTime(`=== IMAGE GENERATION STARTED ===`);

    const styleInfo = ART_STYLES[artStyle] || ART_STYLES.storybook_classic;

    // --- MODE: Unified Gemini Generation ---
    // Use Reference Model if reference image exists, otherwise Standard Model
    const modelName = referenceImage
        ? (process.env.GEMINI_REF_IMAGE_MODEL || 'gemini-3-pro-image-preview')
        : (process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview');

    logWithTime(`Using Gemini Image Mode with model: ${modelName}`);

    const parts: any[] = [];

    // Construct Prompt using localized template
    const prompts = getPrompts(language);
    const promptText = prompts.getIllustrationPrompt(
        scenePrompt,
        characterDescription,
        styleInfo.prompt,
        aspectRatio,
        !!referenceImage
    );

    // Add Reference Image if available
    if (referenceImage) {
        logWithTime('Including Reference Image in prompt...');
        const base64Image = referenceImage.replace(/^data:image\/\w+;base64,/, '');

        parts.push({ text: promptText });
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64Image } });
    } else {
        parts.push({ text: promptText });
    }

    try {
        const response = await genAI.models.generateContent({
            model: modelName,
            contents: [{
                role: 'user',
                parts: parts
            }]
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        if (part?.inlineData?.data) {
            const totalDuration = Date.now() - startTime;
            logWithTime(`=== GEMINI IMAGE GENERATION COMPLETED in ${totalDuration}ms ===`);
            return {
                imageUrl: `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${part.inlineData.data}`,
                usage: {
                    inputTokens: 0,
                    outputTokens: 0,
                    totalTokens: 0,
                    imageCount: 1,
                    model: modelName
                }
            };
        } else {
            throw new Error('No image returned from Gemini');
        }
    } catch (e: any) {
        console.error('[GEMINI IMAGE ERROR]', e);
        throw e;
    }
}

// Extract character description
export async function extractCharacterFromPhoto(photoBase64: string, language: Language = 'en'): Promise<string> {
    const startTime = Date.now();
    const model = process.env.GEMINI_TEXT_MODEL || 'gemini-3-flash-preview';

    try {
        const prompts = getPrompts(language);
        const promptText = prompts.getCharacterExtractionPrompt();

        const response = await genAI.models.generateContent({
            model: model,
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: promptText },
                        {
                            inlineData: {
                                mimeType: 'image/jpeg',
                                data: photoBase64
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
    const CONCURRENCY_LIMIT = 1;
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
                input.aspectRatio,
                input.language || 'en'
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
