// ============================================
// Google Gemini AI Client (Unified SDK)
// ============================================
// AI-powered story and image generation using Gemini 3 & Imagen 3

import { GoogleGenAI } from '@google/genai';
import { ART_STYLES, ArtStyle, ImageQuality } from '../art-styles';
import { getPrompts, Language } from './prompts';
import { withRetry, RETRY_CONFIGS } from '../retry';
import { sanitizeStoryInput, sanitizeInput } from '../sanitize';
import { env } from '@/lib/env';

// Re-export art styles for convenience
export { ART_STYLES, type ArtStyle } from '../art-styles';

// Helper function for logging with timestamps
const logWithTime = (message: string, data?: unknown) => {
    const timestamp = new Date().toISOString();
    const logMsg = `[GEMINI ${timestamp}] ${message}`;
    console.log(logMsg);

    if (data !== undefined) {
        console.log(`[GEMINI ${timestamp}] Data:`, JSON.stringify(data, null, 2).slice(0, 500));
    }
};

// Initialize Gemini client lazily (server-side only)
let _genAI: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
    if (!_genAI) {
        logWithTime('Initializing Gemini Unified client (@google/genai)...');
        _genAI = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
        logWithTime('Gemini client initialized');
    }
    return _genAI;
}

export interface StoryGenerationInput {
    childName: string;
    childAge: number;
    childGender?: 'boy' | 'girl' | 'other';
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

export interface IllustrationOptions {
    scenePrompt: string;
    characterDescription: string;
    artStyle?: ArtStyle;
    quality?: ImageQuality;
    referenceImage?: string;
    aspectRatio?: '1:1' | '3:4';
    language?: Language;
    styleReferenceImage?: string;
    pageNumber?: number;
    totalPages?: number;
    bookTitle?: string;
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
    const textModel = env.GEMINI_TEXT_MODEL;
    logWithTime(`Using model: ${textModel}, language: ${language}`);

    const prompts = getPrompts(language);

    // Sanitize all user-provided inputs before prompt interpolation
    const sanitizedInput = sanitizeStoryInput({
        childName: input.childName,
        childAge: input.childAge,
        childGender: input.childGender,
        bookTheme: input.bookTheme,
        bookType: input.bookType,
        pageCount: input.pageCount || 10,
        characterDescription: input.characterDescription,
        storyDescription: input.storyDescription,
        artStyle: input.artStyle,
    });

    const prompt = prompts.getStoryPrompt(sanitizedInput);

    logWithTime('--- STORY PROMPT SENT TO MODEL ---', prompt);

    try {
        logWithTime('Sending request to Gemini API...');

        const response = await withRetry(
            () => getGenAI().models.generateContent({
                model: textModel,
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    responseMimeType: 'application/json'
                }
            }),
            RETRY_CONFIGS.gemini
        );

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
    options: IllustrationOptions
): Promise<{ imageUrl: string; usage: UsageMetadata }> {
    const {
        scenePrompt,
        characterDescription,
        artStyle = 'storybook_classic',
        quality = 'fast',
        referenceImage,
        aspectRatio = '3:4',
        language = 'en',
        styleReferenceImage,
        pageNumber,
        totalPages,
        bookTitle,
    } = options;

    const startTime = Date.now();
    logWithTime(`=== IMAGE GENERATION STARTED (page ${pageNumber || '?'}/${totalPages || '?'}) ===`);

    const styleInfo = ART_STYLES[artStyle] || ART_STYLES.storybook_classic;

    // --- MODE: Unified Gemini Generation ---
    // Use Reference Model if reference image exists, otherwise Standard Model
    const modelName = referenceImage
        ? env.GEMINI_REF_IMAGE_MODEL
        : env.GEMINI_IMAGE_MODEL;

    logWithTime(`Using Gemini Image Mode with model: ${modelName}`);

    const parts: any[] = [];

    // Sanitize user-controlled inputs before prompt interpolation
    const sanitizedScene = sanitizeInput(scenePrompt, 'storyDescription');
    const sanitizedCharacter = sanitizeInput(characterDescription, 'characterDescription');

    // Construct Prompt using localized template
    const prompts = getPrompts(language);
    const promptText = prompts.getIllustrationPrompt(
        sanitizedScene,
        sanitizedCharacter,
        styleInfo.prompt,
        aspectRatio,
        !!referenceImage,
        pageNumber,
        totalPages,
        !!styleReferenceImage,
        bookTitle
    );

    // Text prompt first
    parts.push({ text: promptText });

    // Add child's Reference Image if available (for facial likeness)
    if (referenceImage) {
        logWithTime('Including Reference Image in prompt...');
        const base64Image = referenceImage.replace(/^data:image\/\w+;base64,/, '');
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64Image } });
    }

    // Add Style Reference Image if available (for visual consistency)
    if (styleReferenceImage) {
        logWithTime('Including Style Reference Image (page 1) in prompt...');
        const base64Style = styleReferenceImage.replace(/^data:image\/\w+;base64,/, '');
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64Style } });
    }

    try {
        const response = await withRetry(
            () => getGenAI().models.generateContent({
                model: modelName,
                contents: [{
                    role: 'user',
                    parts: parts
                }]
            }),
            RETRY_CONFIGS.gemini
        );

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
    const model = env.GEMINI_TEXT_MODEL;

    try {
        const prompts = getPrompts(language);
        const promptText = prompts.getCharacterExtractionPrompt();

        const response = await withRetry(
            () => getGenAI().models.generateContent({
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
            }),
            RETRY_CONFIGS.gemini
        );

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
    onProgress?: (step: string, progress: number) => void,
    options?: {
        illustrationLimit?: number;
        includeBackCover?: boolean;
    }
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

    const characterDescription = input.characterDescription || story.characterDescription || `A cute child named ${input.childName}`;

    const illustrations: string[] = new Array(story.pages.length).fill('');
    const maxIllustrations = Math.min(options?.illustrationLimit ?? story.pages.length, story.pages.length);

    // Concurrency Settings
    const CONCURRENCY_LIMIT = 1;
    const SAFETY_DELAY_MS = 2000; // 2 seconds between batches to be safe with rate limits

    // Style reference: capture page 1's illustration for visual consistency across pages
    let styleReferenceImage: string | undefined;

    // Helper to generate a single page
    const generatePageFn = async (pageIndex: number) => {
        try {
            const { imageUrl, usage: imgUsage } = await generateIllustration({
                scenePrompt: story.pages[pageIndex].imagePrompt,
                characterDescription,
                artStyle: input.artStyle,
                quality: input.imageQuality,
                referenceImage: input.childPhoto,
                aspectRatio: input.aspectRatio,
                language: input.language || 'en',
                styleReferenceImage: pageIndex > 0 ? styleReferenceImage : undefined,
                pageNumber: pageIndex + 1,
                totalPages: story.pages.length,
                bookTitle: story.title,
            });
            illustrations[pageIndex] = imageUrl;

            // Capture first page as style reference for subsequent pages
            if (pageIndex === 0 && imageUrl) {
                styleReferenceImage = imageUrl;
                logWithTime('Captured page 1 as style reference for subsequent pages');
            }

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
    for (let i = 0; i < maxIllustrations; i += CONCURRENCY_LIMIT) {
        const batchStart = i;
        const batchEnd = Math.min(i + CONCURRENCY_LIMIT, maxIllustrations);
        const batchPromises: Promise<void>[] = [];

        logWithTime(`Starting batch ${Math.ceil((i + 1) / CONCURRENCY_LIMIT)}: Pages ${batchStart + 1} to ${batchEnd}`);
        onProgress?.(`Painting pages ${batchStart + 1}-${batchEnd} of ${maxIllustrations}...`, 20 + (70 * (i + 1) / maxIllustrations));

        for (let j = batchStart; j < batchEnd; j++) {
            batchPromises.push(generatePageFn(j));
        }

        await Promise.all(batchPromises);

        // Delay between batches (unless it's the last one)
        if (batchEnd < maxIllustrations) {
            logWithTime(`Batch complete. Waiting ${SAFETY_DELAY_MS}ms safely...`);
            await new Promise(r => setTimeout(r, SAFETY_DELAY_MS));
        }
    }

    // Generate Back Cover
    onProgress?.('Creating back cover...', 95);
    let backCoverImage: string | undefined;
    if (options?.includeBackCover !== false) {
        try {
            const backCoverPrompt = "A magical background pattern or simple scenic view suitable for a book back cover. No characters, just atmosphere matching the book theme.";
            const { imageUrl, usage: backUsage } = await generateIllustration({
                scenePrompt: backCoverPrompt,
                characterDescription: "",
                artStyle: input.artStyle,
                quality: input.imageQuality,
                referenceImage: undefined,
                aspectRatio: input.aspectRatio,
                styleReferenceImage,
                bookTitle: story.title,
            });
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
    }

    logWithTime(`=== FINISHED ===`);
    return { story, illustrations, backCoverImage, generationLogs };
}
