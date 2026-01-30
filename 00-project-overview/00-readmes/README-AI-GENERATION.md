# AI Generation Service

> Story and illustration generation using Google Gemini

## Overview

The AI generation service powers the core functionality of KidBook Creator, generating personalized stories and illustrations using Google's Gemini models.

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  API Routes     │────▶│  Gemini Client   │────▶│  Google Gemini  │
│  /api/ai/*      │     │  lib/gemini/     │     │  API            │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

---

## API Endpoints

### POST `/api/ai/generate-book`
**Complete book generation** - Generates story + all illustrations in one call.

**Request Body:**
```typescript
{
  childName: string;        // Required
  childAge: number;         // Default: 5
  bookTheme: string;        // Required (adventure, bedtime, etc.)
  bookType: string;         // Required (board, picture, story)
  pageCount?: number;       // Default: 10
  characterDescription?: string;
  storyDescription?: string;
  artStyle?: ArtStyle;      // Default: 'storybook_classic'
  imageQuality?: 'fast' | 'pro';  // Default: 'fast'
}
```

**Response:**
```typescript
{
  success: true;
  bookId: string;  // UUID of created book
}
```

**Flow:**
1. Authenticate user via Supabase
2. Generate story with Gemini 3 Pro
3. Generate illustrations for each page
4. Upload images to Supabase Storage
5. Save book + pages to database
6. Return book ID

---

### POST `/api/ai/generate-story`
**Story-only generation** - Returns story JSON without saving.

**Request Body:**
```typescript
{
  childName: string;
  childAge?: number;
  bookTheme: string;
  bookType: string;
  pageCount?: number;
  characterDescription?: string;
}
```

**Response:**
```typescript
{
  success: true;
  story: {
    title: string;
    characterDescription?: string;
    pages: Array<{
      pageNumber: number;
      text: string;
      imagePrompt: string;
    }>;
  }
}
```

---

### POST `/api/ai/generate-image`
**Single image generation** - Generates one illustration.

**Request Body:**
```typescript
{
  prompt: string;   // Scene description
  style?: string;   // Art style key
}
```

**Response:**
```typescript
{
  success: true;
  image: string;  // Base64 data URL
}
```

---

### POST `/api/ai/extract-character`
**Character extraction from photo** - Analyzes uploaded photo to generate character description.

**Request:** `multipart/form-data` with `photo` file

**Response:**
```typescript
{
  success: true;
  characterDescription: string;
}
```

---

## Gemini Client (`lib/gemini/client.ts`)

### Models Used

| Purpose | Model | Notes |
|---------|-------|-------|
| Story Generation | `gemini-3-pro-preview` | High-quality text |
| Image (Fast) | `gemini-2.5-flash-image` | Quick generation |
| Image (Pro) | `gemini-3-pro-image-preview` | Higher quality |
| Character Extraction | `gemini-1.5-flash` | Vision + speed |

### Key Functions

#### `generateStory(input: StoryGenerationInput)`
Generates a complete story structure with page text and image prompts.

```typescript
const story = await generateStory({
  childName: 'Emma',
  childAge: 5,
  bookTheme: 'adventure',
  bookType: 'picture',
  pageCount: 10
});
```

#### `generateIllustration(scenePrompt, characterDescription, artStyle, quality)`
Generates a single illustration in the specified art style.

```typescript
const imageBase64 = await generateIllustration(
  'Emma discovers a magical garden',
  'A 5-year-old girl with curly brown hair',
  'storybook_classic',
  'fast'
);
```

#### `generateCompleteBook(input, onProgress?)`
Orchestrates full book generation with progress callbacks.

```typescript
const { story, illustrations } = await generateCompleteBook(
  input,
  (step, progress) => console.log(`${step}: ${progress}%`)
);
```

#### `extractCharacterFromPhoto(base64Image)`
Analyzes a photo to extract child's physical description.

---

## Art Styles

Defined in `lib/art-styles.ts`:

| Key | Style |
|-----|-------|
| `storybook_classic` | Traditional children's book illustration |
| `watercolor` | Soft watercolor painting style |
| `cartoon` | Bright, animated cartoon style |
| `realistic` | More realistic illustration |

---

## Image Quality Options

| Quality | Model | Speed | Use Case |
|---------|-------|-------|----------|
| `fast` | gemini-2.5-flash-image | ~5-10s/image | Preview, drafts |
| `pro` | gemini-3-pro-image-preview | ~15-30s/image | Final prints |

---

## Error Handling

All endpoints return consistent error responses:

```typescript
{
  error: string;
}
```

| Status | Meaning |
|--------|---------|
| 400 | Missing required fields |
| 401 | Unauthorized (not logged in) |
| 500 | Generation failed |

---

## Logging

The Gemini client includes detailed timestamped logging:

```
[GEMINI 2025-01-17T19:00:00.000Z] === STORY GENERATION STARTED ===
[GEMINI 2025-01-17T19:00:01.500Z] API call completed in 1500ms
[GEMINI 2025-01-17T19:00:01.510Z] Story title: "Emma's Magical Adventure"
```

---

## Rate Limiting

- 500ms delay between image generations to avoid API rate limits
- Consider implementing queue system for high-volume production

---

## Files

| File | Purpose |
|------|---------|
| `app/api/ai/generate-book/route.ts` | Complete book generation endpoint |
| `app/api/ai/generate-story/route.ts` | Story-only generation |
| `app/api/ai/generate-image/route.ts` | Single image generation |
| `app/api/ai/extract-character/route.ts` | Photo character extraction |
| `lib/gemini/client.ts` | Gemini API client |
| `lib/art-styles.ts` | Art style definitions |
