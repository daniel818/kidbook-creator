// ============================================
// Google Gemini AI Client
// ============================================
// AI-powered story and image generation

import { GoogleGenAI, Modality } from '@google/genai';

// Initialize Gemini client
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface StoryGenerationInput {
    childName: string;
    childAge: number;
    bookTheme: string;
    bookType: string;
    pageCount?: number;
    characterDescription?: string;
    storyDescription?: string; // User's custom description of what the story should be about
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
}

// Generate a complete story based on inputs
export async function generateStory(input: StoryGenerationInput): Promise<GeneratedStory> {
    const pageCount = input.pageCount || 10;

    const prompt = `You are a talented children's book author creating a personalized, magical story.

CHILD'S DETAILS:
- Name: ${input.childName}
- Age: ${input.childAge} years old
${input.characterDescription ? `- Appearance: ${input.characterDescription}` : ''}

BOOK SPECIFICATIONS:
- Theme: ${input.bookTheme}
- Type: ${input.bookType}
- Page Count: ${pageCount} pages
${input.storyDescription ? `
STORY DESCRIPTION (follow this closely):
${input.storyDescription}` : ''}

CREATIVE GUIDELINES:
1. Feature ${input.childName} as the heroic main character
2. Make the story age-appropriate and engaging for a ${input.childAge}-year-old
3. Create a clear narrative arc: exciting beginning, adventurous middle, satisfying end
4. Include the "${input.bookTheme}" theme throughout
5. Use vivid, imaginative language that sparks wonder
6. Add gentle life lessons or positive messages
7. Make the child feel special and brave
${input.storyDescription ? `8. Follow the user's story description: "${input.storyDescription}"` : ''}

RETURN FORMAT - Output ONLY this JSON structure:
{
    "title": "An Exciting Book Title",
    "pages": [
        {
            "pageNumber": 1,
            "title": "Optional Chapter Title",
            "text": "Story text for this page (2-4 engaging sentences)",
            "imagePrompt": "Detailed illustration prompt: describe the scene, ${input.childName}'s actions, expressions, surroundings, colors, mood. ${input.characterDescription ? `${input.childName} looks like: ${input.characterDescription}` : ''}"
        }
    ]
}

IMPORTANT:
- Each imagePrompt must be detailed enough to generate consistent, beautiful illustrations
- Include ${input.childName}'s appearance in every imagePrompt for consistency
- Return ONLY valid JSON, no markdown or explanations`;

    const model = genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
    });

    const response = await model;
    const text = response.text || '';

    // Parse the JSON response
    try {
        // Remove markdown code blocks if present
        const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const story = JSON.parse(cleanedText) as GeneratedStory;
        return story;
    } catch {
        console.error('Failed to parse story JSON:', text);
        throw new Error('Failed to generate story - invalid JSON response');
    }
}

// Generate an illustration using Gemini's image generation
export async function generateIllustration(
    prompt: string,
    style: string = 'colorful children\'s book illustration'
): Promise<string> {
    const fullPrompt = `${style}, ${prompt}. High quality, professional children's book art, vibrant colors, friendly and engaging.`;

    const response = await genAI.models.generateContent({
        model: 'gemini-2.0-flash-preview-image-generation',
        contents: fullPrompt,
        config: {
            responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
    });

    // Extract the image from the response
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData?.mimeType?.startsWith('image/')) {
                // Return base64 image data
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }

    throw new Error('No image generated');
}

// Extract character description from an uploaded photo
export async function extractCharacterFromPhoto(photoBase64: string): Promise<string> {
    const response = await genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        text: `Look at this photo of a child. Describe their appearance in detail for use in generating consistent illustrations. Include:
- Hair color and style
- Eye color
- Skin tone
- Any distinctive features
- Clothing (if relevant)

Be specific but keep descriptions suitable for children's book illustrations. Return only the description, no other text.`,
                    },
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: photoBase64,
                        },
                    },
                ],
            },
        ],
    });

    return response.text || 'A cheerful child';
}

// Generate a complete book with story and illustrations
export async function generateCompleteBook(
    input: StoryGenerationInput,
    onProgress?: (step: string, progress: number) => void
): Promise<{
    story: GeneratedStory;
    illustrations: string[];
}> {
    // Step 1: Generate the story
    onProgress?.('Generating story...', 10);
    const story = await generateStory(input);

    // Step 2: Generate illustrations for each page
    const illustrations: string[] = [];
    const totalPages = story.pages.length;

    for (let i = 0; i < story.pages.length; i++) {
        const page = story.pages[i];
        onProgress?.(`Creating illustration ${i + 1} of ${totalPages}...`, 10 + (80 * (i + 1) / totalPages));

        try {
            const illustration = await generateIllustration(page.imagePrompt);
            illustrations.push(illustration);
        } catch (error) {
            console.error(`Failed to generate illustration for page ${i + 1}:`, error);
            // Use a placeholder if illustration fails
            illustrations.push('');
        }
    }

    onProgress?.('Finishing up...', 95);
    return { story, illustrations };
}
