// ============================================
// Google Gemini AI Client
// ============================================
// AI-powered story and image generation using Gemini 3 Pro

import { GoogleGenAI } from '@google/genai';
import { ART_STYLES, ArtStyle, ImageQuality } from '../art-styles';

// Re-export art styles for convenience
export { ART_STYLES, type ArtStyle } from '@/lib/art-styles';

// Helper function for logging with timestamps
const logWithTime = (message: string, data?: unknown) => {
    const timestamp = new Date().toISOString();
    console.log(`[GEMINI ${timestamp}] ${message}`);
    if (data !== undefined) {
        console.log(`[GEMINI ${timestamp}] Data:`, JSON.stringify(data, null, 2).slice(0, 500));
    }
};

// Initialize Gemini client (server-side only)
logWithTime('Initializing Gemini client...');
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
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
    imageQuality?: ImageQuality; // [NEW]
}

// ... (keep generatedPage/story interfaces same)

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
    logWithTime('Input parameters:', input);

    // Use Gemini 3 Pro Preview for high quality text generation
    const textModel = 'gemini-3-pro-preview';
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

    try {
        logWithTime('Sending request to Gemini API...');
        const apiStartTime = Date.now();

        const result = await genAI.models.generateContent({
            model: textModel,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                responseMimeType: 'application/json',
            }
        });

        const apiDuration = Date.now() - apiStartTime;
        logWithTime(`API call completed in ${apiDuration}ms`);

        const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
            logWithTime('ERROR: Empty response from Gemini');
            throw new Error('Empty response from Gemini');
        }

        logWithTime('Parsing response JSON...');
        const storyData = JSON.parse(responseText) as GeneratedStory;

        const totalDuration = Date.now() - startTime;
        logWithTime(`=== STORY GENERATION COMPLETED in ${totalDuration}ms ===`);
        logWithTime(`Story title: "${storyData.title}", Pages: ${storyData.pages?.length || 0}`);

        return storyData;
    } catch (error) {
        const totalDuration = Date.now() - startTime;
        logWithTime(`=== STORY GENERATION FAILED after ${totalDuration}ms ===`);
        console.error('[GEMINI ERROR]', error);
        throw error;
    }
}

// Generate an illustration using Gemini
export async function generateIllustration(
    scenePrompt: string,
    characterDescription: string,
    artStyle: ArtStyle = 'storybook_classic',
    quality: ImageQuality = 'fast' // [NEW]
): Promise<string> {
    const startTime = Date.now();
    logWithTime(`=== IMAGE GENERATION STARTED (quality: ${quality}) ===`);

    const styleInfo = ART_STYLES[artStyle] || ART_STYLES.storybook_classic;
    logWithTime(`Art style: ${artStyle}`);

    const fullPrompt = `Create a children's book illustration in vertical 3:4 portrait aspect ratio.

ART STYLE: ${styleInfo.prompt}

MAIN CHARACTER: ${characterDescription}

SCENE: ${scenePrompt}

REQUIREMENTS:
- The main character should match the description exactly and be recognizable
- High quality, professional children's book art
- Friendly, warm, and engaging for young children
- Clear and expressive character faces with appropriate emotions
- Rich, detailed backgrounds that enhance the story
- Safe for children, no scary or inappropriate content`;

    // Select Model based on Quality
    // Pro: gemini-3-pro-image-preview
    // Fast: gemini-2.5-flash-image
    const imageModel = quality === 'pro' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    logWithTime(`Using model: ${imageModel}`);
    logWithTime(`Prompt preview: ${fullPrompt.slice(0, 150)}...`);

    try {
        logWithTime('Sending image generation request to Gemini API...');
        const apiStartTime = Date.now();

        const response = await genAI.models.generateContent({
            model: imageModel,
            contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        });

        const apiDuration = Date.now() - apiStartTime;
        logWithTime(`API call completed in ${apiDuration}ms`);
        logWithTime('Checking response for image data...');

        if (response.candidates?.[0]?.content?.parts) {
            logWithTime(`Found ${response.candidates[0].content.parts.length} parts in response`);
            for (let i = 0; i < response.candidates[0].content.parts.length; i++) {
                const part = response.candidates[0].content.parts[i];
                logWithTime(`Part ${i}: has inlineData=${!!part.inlineData}, mimeType=${part.inlineData?.mimeType}`);
                if (part.inlineData?.mimeType?.startsWith('image/')) {
                    const dataLength = part.inlineData.data?.length || 0;
                    const totalDuration = Date.now() - startTime;
                    logWithTime(`=== IMAGE GENERATION COMPLETED in ${totalDuration}ms ===`);
                    logWithTime(`Image size: ~${Math.round(dataLength / 1024)}KB`);
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        } else {
            logWithTime('No candidates or parts in response');
            logWithTime('Response structure:', JSON.stringify(Object.keys(response || {})));
        }

        const totalDuration = Date.now() - startTime;
        logWithTime(`=== IMAGE GENERATION FAILED (no image) after ${totalDuration}ms ===`);
        throw new Error('No image in response');
    } catch (error) {
        const totalDuration = Date.now() - startTime;
        logWithTime(`=== IMAGE GENERATION FAILED after ${totalDuration}ms ===`);
        console.error('[GEMINI IMAGE ERROR]', error);
        throw error;
    }
}

// Extract character description from a photo
export async function extractCharacterFromPhoto(base64Image: string): Promise<string> {
    const startTime = Date.now();
    logWithTime('=== CHARACTER EXTRACTION STARTED ===');
    logWithTime(`Base64 image size: ~${Math.round(base64Image.length / 1024)}KB`);

    try {
        logWithTime('Sending request to Gemini API...');
        const apiStartTime = Date.now();

        const result = await genAI.models.generateContent({
            model: 'gemini-1.5-flash', // Using Flash for speed/vision
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: "Describe the child in this photo for a children's book character description. Focus on hair color, eye color, hairstyle, and distinctive features. Keep it brief and positive." },
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

        const apiDuration = Date.now() - apiStartTime;
        logWithTime(`API call completed in ${apiDuration}ms`);

        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        const totalDuration = Date.now() - startTime;
        logWithTime(`=== CHARACTER EXTRACTION COMPLETED in ${totalDuration}ms ===`);
        logWithTime(`Result: ${text?.slice(0, 100)}...`);

        return text || "A happy child";
    } catch (error) {
        const totalDuration = Date.now() - startTime;
        logWithTime(`=== CHARACTER EXTRACTION FAILED after ${totalDuration}ms ===`);
        console.error("[GEMINI CHARACTER ERROR]", error);
        return "A happy child";
    }
}

// Generate a complete book with story and illustrations
export async function generateCompleteBook(
    input: StoryGenerationInput,
    onProgress?: (step: string, progress: number) => void
): Promise<{
    story: GeneratedStory;
    illustrations: string[];
}> {
    const bookStartTime = Date.now();
    logWithTime('========================================');
    logWithTime('=== COMPLETE BOOK GENERATION STARTED ===');
    logWithTime('========================================');
    logWithTime('Input:', input);

    const artStyle = input.artStyle || 'storybook_classic';
    const imageQuality = input.imageQuality || 'fast';
    logWithTime(`Art style: ${artStyle}, Image quality: ${imageQuality}`);

    // Step 1: Generate the story
    logWithTime('>>> STEP 1: Generating story...');
    const storyStartTime = Date.now();
    onProgress?.('Generating your magical story...', 10);
    const story = await generateStory(input);
    const storyDuration = Date.now() - storyStartTime;
    logWithTime(`<<< STEP 1 COMPLETE: Story generated in ${storyDuration}ms`);
    logWithTime(`Story has ${story.pages.length} pages`);

    // Use the character description from the story or input
    const characterDescription = story.characterDescription ||
        input.characterDescription ||
        `A cheerful ${input.childAge}-year-old child named ${input.childName} with a bright smile and friendly expression`;
    logWithTime(`Character description: ${characterDescription.slice(0, 100)}...`);

    // Step 2: Generate illustrations for each page
    logWithTime('>>> STEP 2: Generating illustrations...');
    const illustrations: string[] = [];
    const totalPages = story.pages.length;
    const imagesStartTime = Date.now();

    for (let i = 0; i < story.pages.length; i++) {
        const page = story.pages[i];
        const imageStartTime = Date.now();
        logWithTime(`>>> Image ${i + 1}/${totalPages}: Starting...`);
        onProgress?.(`Creating illustration ${i + 1} of ${totalPages} (${imageQuality} mode)...`, 10 + (80 * (i + 1) / totalPages));

        try {
            const illustration = await generateIllustration(
                page.imagePrompt,
                characterDescription,
                artStyle,
                imageQuality
            );
            illustrations.push(illustration);
            const imageDuration = Date.now() - imageStartTime;
            logWithTime(`<<< Image ${i + 1}/${totalPages}: SUCCESS in ${imageDuration}ms`);
        } catch (error) {
            const imageDuration = Date.now() - imageStartTime;
            logWithTime(`<<< Image ${i + 1}/${totalPages}: FAILED after ${imageDuration}ms`);
            console.error(`[GEMINI] Failed to generate illustration for page ${i + 1}:`, error);
            illustrations.push('');
        }

        // Small delay between image generations to avoid rate limiting
        if (i < story.pages.length - 1) {
            logWithTime(`Waiting 500ms before next image...`);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    const imagesDuration = Date.now() - imagesStartTime;
    logWithTime(`<<< STEP 2 COMPLETE: All ${totalPages} images generated in ${imagesDuration}ms`);
    logWithTime(`Successful images: ${illustrations.filter(i => i).length}/${totalPages}`);

    onProgress?.('Finishing up...', 95);

    const totalDuration = Date.now() - bookStartTime;
    logWithTime('========================================');
    logWithTime(`=== COMPLETE BOOK GENERATION FINISHED in ${totalDuration}ms ===`);
    logWithTime(`Story: ${storyDuration}ms, Images: ${imagesDuration}ms`);
    logWithTime('========================================');

    return { story, illustrations };
}
