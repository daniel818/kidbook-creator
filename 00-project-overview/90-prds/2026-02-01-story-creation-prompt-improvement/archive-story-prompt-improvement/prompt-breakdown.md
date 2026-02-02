# Story Creation Prompt Breakdown

## Overview
This document breaks down the exact prompts sent to each AI model during story book creation, using a 12-page story book as the example (14 illustrations total: 1 cover image, 12 story illustrations, 1 back cover image).

## Total Prompts Sent: 15-16

---

## 1. Story Generation (1 prompt)

**Model:** `gemini-3-flash-preview` (text model)

**Purpose:** Generate the complete story structure

**Prompt:** `getStoryPrompt()` with parameters:
- Child's name, age, theme, book type
- Page count: 12
- Character description (if provided)
- Story description (if provided)
- Language instructions

**Output:** JSON with:
- Book title
- 12 page objects (each with text + image prompt)
- Character description
- Back cover blurb

---

## 2. Character Extraction (1 prompt - ONLY if child photo provided)

**Model:** `gemini-3-flash-preview` (text model)

**Purpose:** Analyze child's photo to extract physical description

**Prompt:** `getCharacterExtractionPrompt()`

**Input:** Child's photo + analysis instructions

**Output:** Detailed physical description of the child

---

## 3. Cover Illustration (1 prompt)

**Model:** `gemini-3-pro-image-preview` (image model)

**Purpose:** Generate cover illustration

**Prompt:** `getIllustrationPrompt()` with:
- Cover scene description
- Character description
- Art style instructions
- Aspect ratio (1:1 or 3:4)
- Reference image (if photo provided)

---

## 4. Story Illustrations (12 prompts - one per story page)

**Model:** `gemini-3-pro-image-preview` (image model)

**Purpose:** Generate illustration for each story page

**Prompt:** `getIllustrationPrompt()` for each page:
- Scene description (from story generation)
- Character description (extracted or provided)
- Art style instructions
- Aspect ratio (1:1 or 3:4)
- Reference image (if photo provided)

**Processing:** 
- Sequential processing (1 at a time due to rate limits)
- 2-second delay between each image
- Each prompt generates 1 illustration

---

## 5. Back Cover Illustration (1 prompt)

**Model:** `gemini-3-pro-image-preview` (image model)

**Purpose:** Generate back cover background

**Prompt:** Fixed prompt: "A magical background pattern or simple scenic view suitable for a book back cover. No characters, just atmosphere matching the book theme."

**Input:** Art style, aspect ratio only

---

## Summary by Model Usage

### Text Model (`gemini-3-flash-preview`)
- **1 prompt** for story generation
- **1 prompt** for character extraction (if photo provided)
- **Total: 1-2 prompts**

### Image Model (`gemini-3-pro-image-preview`)
- **1 prompt** for cover illustration
- **12 prompts** for story illustrations
- **1 prompt** for back cover
- **Total: 14 prompts**

### Grand Total: 15-16 prompts
- **Without photo:** 15 prompts (1 text + 14 image)
- **With photo:** 16 prompts (2 text + 14 image)

### Total Images Generated: 14
- **1 cover image**
- **12 story illustrations**
- **1 back cover image**

---

## Processing Flow

1. **Story generation** (creates all text content and image prompts)
2. **Character extraction** (if photo provided, before illustrations)
3. **Cover illustration** (first image generated)
4. **Story illustrations 1-12** (sequential with delays)
5. **Back cover** (final step)

---

## Notes

- The cover illustration is generated separately from story illustrations
- The cover page text (title) is created during story generation step 1
- All prompts are localized based on the user's language selection
- Rate limiting requires sequential processing of images with delays
- Character extraction only occurs when a child photo is provided
- Total illustrations: 14 (1 cover + 12 story + 1 back cover)
