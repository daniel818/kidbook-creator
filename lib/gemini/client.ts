// ============================================
// Google Gemini AI Client
// ============================================
// AI-powered story and image generation using Gemini 3 Pro

import { GoogleGenAI } from '@google/genai';
import { ART_STYLES, ArtStyle, ImageQuality } from '../art-styles';

// Re-export art styles for convenience
export { ART_STYLES, type ArtStyle } from '@/lib/art-styles';

// Initialize Gemini client (server-side only)
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

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
    console.log('Generating story with Gemini 3 Pro Preview...');

    // Use Gemini 3 Pro Preview for high quality text generation
    const textModel = 'gemini-3-pro-preview';

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
        const result = await genAI.models.generateContent({
            model: textModel,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                responseMimeType: 'application/json',
            }
        });

        // The new SDK response structure might differ. 
        // Based on generateIllustration usage, it returns a response object directly or wrapper?
        // Let's assume result is the response or has data.
        // generateIllustration accesses result.candidates?.[0]?.content?.parts

        const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
            throw new Error('Empty response from Gemini');
        }

        const storyData = JSON.parse(responseText) as GeneratedStory;
        return storyData;
    } catch (error) {
        console.error('Error generating story:', error);
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
    const styleInfo = ART_STYLES[artStyle] || ART_STYLES.storybook_classic;

    const fullPrompt = `Create a children's book illustration.

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

    try {
        console.log(`Generating illustration with ${imageModel}...`);
        console.log('Prompt (first 100 chars):', fullPrompt.slice(0, 100) + '...');

        const response = await genAI.models.generateContent({
            model: imageModel,
            contents: fullPrompt,
        });

        console.log('Gemini response received, checking for image...');

        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData?.mimeType?.startsWith('image/')) {
                    console.log('Image found in response!');
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }

        console.error('No image in Gemini response');
        throw new Error('No image in response');
    } catch (error) {
        console.error('Gemini image generation error:', error);
        throw error;
    }
}

// Extract character description from a photo
export async function extractCharacterFromPhoto(base64Image: string): Promise<string> {
    console.log('Extracting character from photo...');
    try {
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

        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        return text || "A happy child";
    } catch (error) {
        console.error("Error extracting character:", error);
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
    const artStyle = input.artStyle || 'storybook_classic';
    const imageQuality = input.imageQuality || 'fast'; // [NEW]

    // Step 1: Generate the story
    onProgress?.('Generating your magical story...', 10);
    const story = await generateStory(input);

    // Use the character description from the story or input
    const characterDescription = story.characterDescription ||
        input.characterDescription ||
        `A cheerful ${input.childAge}-year-old child named ${input.childName} with a bright smile and friendly expression`;

    // Step 2: Generate illustrations for each page
    const illustrations: string[] = [];
    const totalPages = story.pages.length;

    for (let i = 0; i < story.pages.length; i++) {
        const page = story.pages[i];
        onProgress?.(`Creating illustration ${i + 1} of ${totalPages} (${imageQuality} mode)...`, 10 + (80 * (i + 1) / totalPages));

        try {
            const illustration = await generateIllustration(
                page.imagePrompt,
                characterDescription,
                artStyle,
                imageQuality // [NEW]
            );
            illustrations.push(illustration);
        } catch (error) {
            console.error(`Failed to generate illustration for page ${i + 1}:`, error);
            illustrations.push('');
        }

        // Small delay between image generations to avoid rate limiting
        if (i < story.pages.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    onProgress?.('Finishing up...', 95);
    return { story, illustrations };
}
