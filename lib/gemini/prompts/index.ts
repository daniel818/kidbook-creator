// Prompt Templates - Unified Template Approach
// Uses English instructions with language variables to generate content in any target language

// Language display names for better UX in prompts
const LANGUAGE_NAMES: Record<string, string> = {
    en: 'English',
    de: 'German (Deutsch)',
    he: 'Hebrew (עברית)',
};

export type Language = 'en' | 'de' | 'he';

// ============================================
// Core Prompt Template Functions
// ============================================

export const getStoryPrompt = (
    input: {
        childName: string;
        childAge: number;
        bookTheme: string;
        bookType: string;
        pageCount: number;
        characterDescription?: string;
        storyDescription?: string;
    },
    targetLanguage: Language = 'en'
) => {
    const languageName = LANGUAGE_NAMES[targetLanguage] || targetLanguage.toUpperCase();

    return `
Create a children's book story based on the following details:
- Child's Name: ${input.childName}
- Age: ${input.childAge}
- Theme: ${input.bookTheme}
- Type: ${input.bookType}
- Page Count: ${input.pageCount}
${input.characterDescription ? `- Character Description: ${input.characterDescription}` : ''}
${input.storyDescription ? `- Specific Story Request: ${input.storyDescription}` : ''}

The story should be engaging, age-appropriate, and magical.

CRITICALLY IMPORTANT:
- Write the ENTIRE story exclusively in ${languageName}
- NO other languages - all words must be ${languageName}
- Title, text, and imagePrompt must be completely in ${languageName}
- Use only ${languageName} words and grammar

OUTPUT FORMAT:
Return ONLY a valid JSON object with the following structure:
{
    "title": "Title of the book (in ${languageName})",
    "backCoverBlurb": "A short, engaging summary of the story for the back cover (2-3 sentences max, in ${languageName})",
    "characterDescription": "A detailed physical description of the main character (if not provided, in ${languageName})",
    "pages": [
        {
            "pageNumber": 1,
            "text": "Story text for this page (keep it short for children, in ${languageName})",
            "imagePrompt": "A detailed description of the illustration for this page, describing the scene and action ONLY (in ${languageName}). Do NOT describe the art style (e.g. 'cartoon', 'watercolor') as this is handled separately."
        },
        ...
    ]
}

REMINDER: Use EXCLUSIVELY ${languageName} language in ALL fields. NO English or other languages!
`;
};

export const getCharacterExtractionPrompt = (targetLanguage: Language = 'en') => {
    const languageName = LANGUAGE_NAMES[targetLanguage] || targetLanguage.toUpperCase();

    return `
Analyze this image and create a highly detailed character reference description for an AI image generator.
Focus on:
- Physical features (face shape, eyes, nose, mouth, skin tone)
- Hair (color, style, length, texture)
- Age appearance
- Distinctive features
- Clothing style (if visible)

Be specific and detailed. This description will be used to generate consistent character illustrations.

IMPORTANT: Write your response in ${languageName}.
`;
};

export const getIllustrationPrompt = (
    scenePrompt: string,
    characterDescription: string,
    stylePrompt: string,
    aspectRatio: '1:1' | '3:4',
    hasReferenceImage: boolean,
    targetLanguage: Language = 'en'
) => {
    const languageName = LANGUAGE_NAMES[targetLanguage] || targetLanguage.toUpperCase();

    let prompt = `Generate a children's book illustration.
Style: ${stylePrompt}
Scene: ${scenePrompt}
Character: ${characterDescription}
Ratio: ${aspectRatio === '1:1' ? 'Square 1:1' : '3:4 Portrait'}.
High quality, vibrant, detailed.
Ensure the art style is consistent with the description above.`;

    if (hasReferenceImage) {
        prompt += "\nIMPORTANT: The character MUST look exactly like the child in the provided reference image. Maintain facial features, hair, and likeness.";
    }

    // Note: Image generation prompts work best in English regardless of the story language
    // The scene description coming from the story will already be in the target language
    return prompt;
};

// ============================================
// Convenience API
// ============================================

export const getPrompts = (language: Language = 'en') => {
    return {
        getStoryPrompt: (input: {
            childName: string;
            childAge: number;
            bookTheme: string;
            bookType: string;
            pageCount: number;
            characterDescription?: string;
            storyDescription?: string;
        }) => getStoryPrompt(input, language),

        getCharacterExtractionPrompt: () => getCharacterExtractionPrompt(language),

        getIllustrationPrompt: (
            scenePrompt: string,
            characterDescription: string,
            stylePrompt: string,
            aspectRatio: '1:1' | '3:4',
            hasReferenceImage: boolean
        ) => getIllustrationPrompt(
            scenePrompt,
            characterDescription,
            stylePrompt,
            aspectRatio,
            hasReferenceImage,
            language
        ),
    };
};
