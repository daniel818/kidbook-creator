// English AI Prompts for Story Generation

export const getStoryPrompt = (input: {
    childName: string;
    childAge: number;
    childGender?: 'boy' | 'girl' | 'other';
    bookTheme: string;
    bookType: string;
    pageCount: number;
    characterDescription?: string;
    storyDescription?: string;
}) => `
Create a children's book story based on the following details:
- Child's Name: ${input.childName}
- Age: ${input.childAge}
- Gender: ${input.childGender || 'unspecified'}
- Theme: ${input.bookTheme}
- Type: ${input.bookType}
- Page Count: ${input.pageCount}
${input.characterDescription ? `- Character Description: ${input.characterDescription}` : ''}
${input.storyDescription ? `- Specific Story Request: ${input.storyDescription}` : ''}

The story should be engaging, age-appropriate, and magical.

CRITICALLY IMPORTANT:
- Write the ENTIRE story exclusively in ENGLISH
- NO other languages - all words must be English
- Title, text, and imagePrompt must be completely in English
- Use only English words and grammar
- Pronouns rule: if Gender is boy use he/him; if girl use she/her; if other use they/them.
- If Gender is other, keep descriptions gender-neutral (avoid gendered clothing/traits).

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

export const getCharacterExtractionPrompt = () => `
Analyze this image and create a highly detailed character reference description for an AI image generator.
Focus on:
- Physical features (face shape, eyes, nose, mouth, skin tone)
- Hair (color, style, length, texture)
- Age appearance
- Distinctive features
- Clothing style (if visible)

Be specific and detailed. This description will be used to generate consistent character illustrations.
`;

export const getIllustrationPrompt = (
    scenePrompt: string,
    characterDescription: string,
    stylePrompt: string,
    aspectRatio: '1:1' | '3:4',
    hasReferenceImage: boolean
) => {
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

    return prompt;
};
