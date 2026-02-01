# Original Story Generation Prompt (English)

**Source:** `lib/gemini/prompts/en.ts`  
**Function:** `getStoryPrompt()`  
**Model:** `gemini-3-flash-preview`

---

## Prompt Template

```
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
- Write the ENTIRE story exclusively in ENGLISH
- NO other languages - all words must be English
- Title, text, and imagePrompt must be completely in English
- Use only English words and grammar

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
```

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `childName` | string | Yes | Name of the child protagonist |
| `childAge` | number | Yes | Age of the child (0-12) |
| `bookTheme` | string | Yes | Theme: adventure, bedtime, learning, fantasy, animals, custom |
| `bookType` | string | Yes | Type: board, picture, story, alphabet |
| `pageCount` | number | Yes | Number of story pages (typically 12) |
| `characterDescription` | string | No | Physical description of child (from photo or user input) |
| `storyDescription` | string | No | User's custom story request/description |

---

## Output Structure

```typescript
{
  title: string;
  backCoverBlurb: string;
  characterDescription: string;
  pages: Array<{
    pageNumber: number;
    text: string;
    imagePrompt: string;
  }>;
}
```

---

## Current Strengths

- ✅ Clear input parameter structure
- ✅ Strong language enforcement (English only)
- ✅ JSON output format specification
- ✅ Separation of scene description from art style
- ✅ Flexible character description handling
- ✅ Custom story request support

---

## Current Limitations

- ❌ No age-specific writing guidelines (word count, sentence length)
- ❌ No theme-specific narrative structure
- ❌ No explicit content safety rules
- ❌ No narrative arc framework
- ❌ No character development guidance
- ❌ Generic "engaging, age-appropriate, magical" instruction
- ❌ No cover/back cover content specifications
- ❌ No page-by-page story structure guidance
