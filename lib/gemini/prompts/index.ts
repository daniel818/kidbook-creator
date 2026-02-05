// Prompt Templates - v4 Research Learnings Applied
// Incorporates findings from 00-project-overview/90-prds/2026-02-01-story-creation-prompt-improvement

// Language display names for better UX in prompts
const LANGUAGE_NAMES: Record<string, string> = {
    en: 'English',
    de: 'German (Deutsch)',
    he: 'Hebrew (עברית)',
};

export type Language = 'en' | 'de' | 'he';

// ============================================
// Helper Functions for Dynamic Prompt Sections
// ============================================

/**
 * Returns age-specific guidelines based on research findings
 */
function getAgeGuidelines(age: number): string {
    if (age >= 0 && age <= 2) {
        return `
AGES 0-2: 20-40 words/page, 1 paragraph (2-3 short sentences)

MANDATORY:
- 1+ onomatopoeia per page (Moo, Splash, Beep)
- 1-3 participation moments ("Wave bye-bye!", "Can you point?")
- 5+ sensory words (soft, warm, bumpy, fluffy)

DO: Use rhythm, anchor words, sing-song cadences
DON'T: Use pronouns without clear reference, metaphors, or multiple ideas per page`;
    }

    if (age >= 3 && age <= 4) {
        return `
AGES 3-4: 10-50 words/page, 5-10 words/sentence

MANDATORY:
- 3+ participation moments throughout story
- 8+ vivid descriptive words (sparkling, enormous, cozy, glistening)
- 1-2 onomatopoeia per spread
- Concrete, specific details (not abstract)

DO: Use refrains, rich descriptions, linear timeline
DON'T: Create walls of text, preachy lessons, or confusing time jumps`;
    }

    if (age >= 5 && age <= 6) {
        return `
AGES 5-6: 5-40 words/page, 2-8 words/sentence

MANDATORY:
- 6+ vivid action words (zoomed, tumbled, soared, grabbed)
- Concrete details (specific goals, not abstract ideas)
- Coping strategy if challenging theme

DO: Use sight words, short punchy sentences, phonics-friendly words
DON'T: Use slang, multi-syllabic words, or break sentences across pages`;
    }

    if (age >= 7 && age <= 8) {
        return `
AGES 7-8: 50-150 words/page, 7-12 words/sentence

MANDATORY:
- 10+ varied descriptive words
- 2+ humor moments
- Protagonist solves problem themselves (not rescued)
- Concrete goals and actions

DO: Use action-reaction sequences, humor, protagonist agency, varied sentence length
DON'T: Use dense internal monologue, passive characters, or introduce too many characters`;
    }

    if (age >= 9 && age <= 12) {
        return `
AGES 9-12: 60-90 words/page, 2-3 paragraphs (max 30-40 words each)

MANDATORY:
- 10+ descriptive words (show don't tell)
- Authentic kid voice (not adult-sounding)
- Emotional depth
- Realistic coping for challenging themes

DO: Tackle real issues, use literary devices, be concise yet impactful
DON'T: Use graphic content, patronizing tone, sacrifice character for world-building, or walls of text`;
    }

    return ''; // Fallback
}

/**
 * Returns theme-specific structure and guidance
 */
function getThemeStructure(theme: string): string {
    const themeKey = theme.toLowerCase();

    const structures: Record<string, string> = {
        adventure: `
ADVENTURE: Discovery, obstacles, courage, return home wiser.
TONE: Exciting, empowering, wonder-filled`,

        bedtime: `
BEDTIME: Calming progression to rest, gentle transitions, peaceful resolution.
NO excitement or scary moments - everything trends toward calm.
TONE: Soothing, calm, reassuring`,

        learning: `
LEARNING: Clear objective, repetition with variation, interactive elements.
Weave lessons naturally into story (no preaching), build confidence through mastery.
TONE: Encouraging, playful, confidence-building`,

        fantasy: `
FANTASY: Magical world with clear rules, discovery, wonder.
Magic has limits - child uses courage/kindness, not just magic.
TONE: Whimsical, wonder-filled, imaginative`,

        animals: `
ANIMALS: Accurate behaviors, natural habitats, respect for nature.
Animals have personality but behave naturally (no supernatural powers).
TONE: Respectful, educational, warm`,

        custom: `
CUSTOM: Follow story request while maintaining safety, age-appropriateness, and narrative arc.
For challenging themes: acknowledge emotion, include coping strategy, end empowered.`
    };

    return structures[themeKey] || structures.custom;
}

// ============================================
// Core Prompt Template Functions
// ============================================

export const getStoryPrompt = (
    input: {
        childName: string;
        childAge: number;
        childGender?: 'boy' | 'girl' | 'other';
        bookTheme: string;
        bookType: string;
        pageCount: number;
        characterDescription?: string;
        storyDescription?: string;
    },
    targetLanguage: Language = 'en'
) => {
    const languageName = LANGUAGE_NAMES[targetLanguage] || targetLanguage.toUpperCase();
    const ageGuidelines = getAgeGuidelines(input.childAge);
    const themeStructure = getThemeStructure(input.bookTheme);

    return `
You are an expert children's book author creating FUN, ENGAGING, MEMORABLE stories that are safe and age-appropriate.

--- STORY PARAMETERS ---

Child's Name: ${input.childName}
Age: ${input.childAge} years old
Book Type: ${input.bookType}
Theme: ${input.bookTheme}
Page Count: ${input.pageCount} (MUST be exactly this number)
${input.characterDescription ? `Character Description: ${input.characterDescription}` : ''}
${input.storyDescription ? `Story Request: ${input.storyDescription}` : ''}

--- STORY ESSENCE (EVERY STORY, EVERY AGE) ---

Every story MUST feel MAGICAL. "Magical" means:
- WONDER - something feels special or extraordinary
- EMOTIONAL RESONANCE - moments that touch the heart
- SURPRISE - at least one delightful unexpected moment
- POSITIVITY - warmth, hope, joy woven throughout
- That "larger than life" quality where ordinary moments become extraordinary

This applies to ALL themes, even realistic ones. A story about washing hands can feel magical when bubbles shimmer like tiny rainbows.

--- TEXT FORMATTING ---

Structure text as 1-3 paragraphs per page:
- Ages 0-4: 1 paragraph (2-3 sentences)
- Ages 5-8: 1-2 paragraphs (3-5 sentences total)
- Ages 9-12: 2-3 paragraphs (30-40 words each, max 90 words total)

The text as written IS the final exported text - size cannot be adjusted.

--- AGE-SPECIFIC GUIDELINES ---

${ageGuidelines}

--- THEME STRUCTURE ---

${themeStructure}

--- CONTENT SAFETY (MANDATORY) ---

EXCLUDE: Violence, weapons, scary content, death, injury, illness, abandonment, stereotypes, body shaming, bullying, brands, religious/political content, celebrities, social media.

INCLUDE: Kindness, empathy, friendship, curiosity, creativity, family love, self-confidence, respect for nature, diversity, positive emotions.

--- STORY ARC ---

ARC: Warm opening → Building excitement → Empowering climax → Satisfying resolution → Positive ending.
AVOID: Boring, preachy, heavy, anxiety-inducing, sad endings.

--- ENGAGEMENT ---

PARTICIPATION (Ages 0-4 MANDATORY): 3+ moments of counting, sounds, actions, or repeating phrases.

CONCRETE DETAILS: Use specific goals, not abstract concepts.
- BAD: "${input.childName} wanted to help people"
- GOOD: "${input.childName} wanted to help Mrs. Garcia carry her grocery bags"

--- CHALLENGING THEMES (if applicable) ---

For fear, nervousness, anger, sadness, jealousy:

COPING STRATEGY (MANDATORY): Include ONE technique:
- "Superhero breath" - breathe in deep, out slow
- "Count to three" - pause before reacting
- "Hug your teddy" - comfort object
- "Ask for help" - it's okay to need support

Acknowledge feeling → Show authentic emotion → Demonstrate coping → End empowered.

--- HELPER CHARACTERS (if applicable) ---

If including a helper character:
- **Realistic themes** (school, sports, daily life): Family, friends, teachers, coaches, pets that behave naturally
- **Fantasy themes** (magic, adventure): Magical creatures welcome - can glow, sparkle, have abilities
- **${input.childName} is the HERO** - helper supports but child solves the problem
- Give helpers memorable names and keep their appearance consistent throughout the story

--- STORY STRUCTURE ---

Create a satisfying narrative arc across exactly ${input.pageCount} pages:
- **Beginning**: Introduce ${input.childName} and their world
- **Middle**: Build to challenge, adventure, or discovery  
- **Climax**: Main challenge or exciting moment
- **Resolution**: Problem solved, goal achieved
- **Ending**: Warm, positive conclusion

${input.childName} is active protagonist who shows emotions, solves problems, and demonstrates growth.

--- TITLE & BACK COVER ---

TITLE: Creative, captures essence.
- GOOD: "Emma's Super Potty Power"
- BAD: "Emma's Potty Story"

BLURB: 2-3 sentences introducing ${input.childName} with positive trait, hinting at adventure.

--- LANGUAGE ---

Write ENTIRELY in ${languageName}. NO other languages.

--- IMAGE PROMPTS (CRITICAL) ---

Each imagePrompt MUST be 60-100 words of PURE SCENE DESCRIPTION.
DO NOT include the character description in the imagePrompt - it is already provided separately in characterDescription.

MANDATORY STRUCTURE:
"[Character Action]. [Setting with specific details]. [Atmosphere and mood]. [Composition notes]."

EXAMPLE (Good - 75 words):
"Standing in the center of a cheerful playroom bathed in warm afternoon sunlight streaming through a large window. A soft cream-colored rug beneath her feet, wooden shelves behind her hold colorful stacking toys and plush animals. A big red balloon floats near the ceiling. Walls painted soft mint green, golden dust particles dance in the sunbeams. She claps her hands with pure joy, eyes sparkling. Medium shot, slightly low angle."

FIVE MANDATORY ELEMENTS:
1. ACTION: What the character is doing (dynamic verb, expression, pose)
2. SETTING: Specific location (not just "room" - describe it: "cozy wooden nursery with star-patterned curtains")
3. LIGHTING/TIME: Natural light source, time of day, shadows ("warm morning sun through sheer curtains")
4. BACKGROUND DETAILS: 3-5 specific objects or environmental features with colors
5. COMPOSITION: Camera angle, focal point, spatial relationships

QUALITY CHECKLIST:
✓ 60-100 words minimum (scene only, not including character)
✓ At least 3 specific colors mentioned
✓ Lighting source specified
✓ 3+ background objects/details
✓ Clear action verb

RESTRICTIONS:
✗ NO text/words/letters in illustrations
✗ NO signs, labels, speech bubbles
✗ NO character description in imagePrompt (already provided separately)

ATMOSPHERE:
- **Realistic stories:** Natural lighting, authentic expressions, warm tones, emotional connections
- **Fantasy stories:** Magical glows, sparkles, vibrant mystical colors - ALL WELCOME!

AGE-SPECIFIC IMAGERY:
- Ages 0-2: Simple focal points, primary colors, high contrast
- Ages 3-4: 2-3 focal points, vibrant colors, playful compositions
- Ages 5-6: Multiple elements, action scenes, dynamic angles
- Ages 7-12: Complex scenes, nuanced expressions, environmental storytelling

--- OUTPUT FORMAT ---

Return ONLY valid JSON in ${languageName}:

{
    "title": "Engaging title (in ${languageName})",
    "backCoverBlurb": "2-3 sentence summary (in ${languageName})",
    "characterDescription": "Physical description of ${input.childName} (in ${languageName})",
    "pages": [
        {
            "pageNumber": 1,
            "text": "Story text (age-appropriate length, in ${languageName})",
            "imagePrompt": "RICH scene description 40-100 words (in ${languageName})"
        }
        // ... exactly ${input.pageCount} pages
    ]
}

CRITICAL: Exactly ${input.pageCount} pages. Consistent character appearance. All content in ${languageName}.
`;
};

export const getCharacterExtractionPrompt = (targetLanguage: Language = 'en') => {
    const languageName = LANGUAGE_NAMES[targetLanguage] || targetLanguage.toUpperCase();

    return `
Analyze this image and create a detailed character reference description (80-120 words) for consistent AI illustration generation.

EXTRACT THESE LAYERS:

1. PHYSICAL IDENTITY (anchors):
   • Age/life stage (e.g., "toddler ~2-3 years old")
   • Hair: color with nuances, texture, length, quirks
   • Eyes: exact color, shape, expression quality
   • Face: shape, distinctive features (dimples, teeth visibility, beauty marks)

2. EMOTIONAL BASELINE:
   • Default expression and energy (joyful, calm, curious, mischievous)
   • How they carry themselves (warm, energetic, serene)

3. PROPORTIONS:
   • Age-appropriate body proportions
   • Physical presence (soft, bouncy, grounded)

4. SIGNATURE STYLING:
   • Core clothing colors and style
   • Texture cues (denim, cotton, knits)

OUTPUT: Write a flowing paragraph capturing this character's "visual DNA" - a portable identity recognizable across any scene.

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
            childGender?: 'boy' | 'girl' | 'other';
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
