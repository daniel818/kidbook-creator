# Story Prompts - Logic & Architecture

> Prompt engineering for story generation, character extraction, and illustration

## Overview

This document covers the prompt architecture used in `lib/gemini/prompts/index.ts` for generating consistent, high-quality children's book content.

---

## Prompt Functions

| Function | Purpose | Output |
|----------|---------|--------|
| `getStoryPrompt()` | Generates complete story with text + image prompts | JSON with title, pages, prompts |
| `getCharacterExtractionPrompt()` | Extracts character description from photo | 80-120 word character description |
| `getIllustrationPrompt()` | Assembles final image generation prompt | Combined scene + character + style |

---

## 1. Story Prompt Architecture

### Input Parameters
```typescript
{
  childName: string;
  childAge: number;         // Determines content guidelines
  bookTheme: string;        // adventure, bedtime, learning, etc.
  bookType: string;         // board, picture, story
  pageCount: number;        // 8-15 pages
  characterDescription?: string;
  storyDescription?: string;
}
```

### Key Sections

#### Age-Specific Guidelines
Each age group (0-2, 3-4, 5-6, 7-8, 9-12) has tailored:
- Word count per page
- Sentence complexity
- Mandatory engagement elements (onomatopoeia, sensory words, etc.)
- Theme handling (gentle vs. realistic coping)

#### Image Prompt Requirements
Scene descriptions must be **60-100 words** and include:
1. **Character Action** - what they're doing
2. **Setting Details** - specific location with atmosphere
3. **Lighting/Mood** - time of day, emotional tone
4. **Composition Notes** - camera angle, focal point

**Example:**
```
A cozy bedroom bathed in soft blue-violet twilight. Through a large window, 
a full silver moon glows against a gradient sky of deep purples and navy blues. 
The room has cream-colored walls with delicate star decals. A plush lavender 
armchair sits near the window. She sits on the windowsill, knees tucked up, 
gazing at the moon with a sleepy smile, her face illuminated by moonlight. 
Medium shot, warm and peaceful atmosphere.
```

#### Safety Compliance
Automatic exclusion of: violence, scary content, death, stereotypes, brands, etc.

---

## 2. Character Extraction Architecture

### Layered Extraction (80-120 words)

| Layer | Elements |
|-------|----------|
| **Physical Identity** | Age, hair (color/texture/quirks), eyes (color/shape), face shape, distinctive features |
| **Emotional Baseline** | Default expression, energy, how they carry themselves |
| **Proportions** | Age-appropriate body proportions, physical presence |
| **Signature Styling** | Core clothing colors/style, texture cues |

### Output Format
A flowing paragraph capturing the character's "visual DNA" - a portable identity recognizable across any scene.

**Example:**
```
A joyful toddler, approximately 2-3 years old, with light golden-blonde curly 
hair featuring soft wispy ringlets that bounce around the forehead and ears. 
Bright blue-green eyes sparkle with pure delight, set in a round, cherubic face 
with rosy apple cheeks. A wide, uninhibited smile reveals small baby teeth, 
radiating infectious happiness. The child's energy is exuberant and warm, 
carrying an open, carefree presence. Signature styling features a vibrant red 
cotton t-shirt layered under classic blue denim overalls.
```

---

## 3. Illustration Prompt Assembly

### Template Structure
```
Generate a children's book illustration.
Style: ${stylePrompt}
Scene: ${scenePrompt}              ← 60-100 words from story
Character: ${characterDescription}  ← 80-120 words from extraction
Ratio: ${aspectRatio}
High quality, vibrant, detailed.
Ensure the art style is consistent with the description above.
```

### With Reference Image
Adds:
```
IMPORTANT: The character MUST look exactly like the child in the provided 
reference image. Maintain facial features, hair, and likeness.
```

---

## Multi-Language Support

| Language | Code |
|----------|------|
| English | `en` |
| German | `de` |
| Hebrew | `he` |
| French | `fr` |
| Spanish | `es` |
| ... | ... |

All prompts accept `targetLanguage` parameter for localized output.

---

## Quality Standards

| Component | Word Count | Key Requirements |
|-----------|------------|------------------|
| Scene Prompt | 60-100 | Action + Setting + Mood + Composition |
| Character Description | 80-120 | 4 layers of visual identity |
| Story Text | Age-dependent | Engagement elements + safety compliance |

---

## Related Documentation

- [README-STORY-PROMPTS-EVALUATION.md](./README-STORY-PROMPTS-EVALUATION.md) - Evaluation framework
- [README-AI-GENERATION.md](./README-AI-GENERATION.md) - API endpoints and client

---

## Version History

| Date | Change |
|------|--------|
| Feb 3, 2026 | Added layered character extraction (80-120 words) |
| Feb 3, 2026 | Enhanced scene prompts to 60-100 words with 5-element structure |
| Feb 2, 2026 | Multi-language template system |
| Feb 1, 2026 | Initial prompt architecture |
