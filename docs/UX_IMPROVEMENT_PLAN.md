# UX Improvement Plan: Book Creation & Ordering Flow

Based on the review of the current workflow (`app/page.tsx`, `lib/types.ts`, `app/create/[bookId]/order/page.tsx`), we have identified key areas to streamline the user experience and prevent configuration errors.

## 1. Creation Flow: Clarifying "Book Type"

**Current State:**
The user is asked to choose a "Book Type" (Board Book, Picture Book, Story Book, Alphabet Book).
*   **Confusion:** "Board Book" is a physical format, while "Alphabet Book" is a content structure. This mixes *what it is* vs. *how it's printed*.
*   **Impact:** Users are unsure if this choice limits their printing options later.

**Proposed Change:**
Rename this step to **"Story Style"** or **"Content Type"**.
Focus purely on the *content* and *age appropriateness*, managing expectations for the text complexity.

**New Categories:**
*   **Simple Words (Ages 0-3)**: High repetition, very short text. (Replaces "Board Book" concept)
*   **Picture Story (Ages 3-6)**: Standard picture book narrative.
*   **Early Reader (Ages 5-8)**: More complex sentences, slightly longer story.
*   **Alphabet Fun (Ages 2-5)**: A-Z structure.

**Visual Helper:**
*   Add a small "Text Example" tooltip or preview for each type so users know what they are getting.

---

## 2. Creation Flow: Format (Shape) Selection

**Current State:**
User selects "Print Format" (Square vs Portrait) early on. This drives the Image Aspect Ratio (1:1 vs 3:4).
*   **Status:** This is correct and necessary for generation.
*   **Improvement:** Make it explicitly clear that this choice dictates the *physical shape* of the final book. Use icons like ⬜️ (Square) vs ▯ (Portrait).

---

## 3. Order Flow: Smart Size Constraints

**Current State:**
On the Order Page, users are presented with *all* size options ('7.5x7.5', '8x8', '8x10') regardless of the book's generated aspect ratio.
*   **The Risk:** A user generates a Square book (1:1 images) but orders an 8x10 Portrait book. This results in either ugly cropping or massive white bars.

**Proposed Change:**
Filter the **Size Selection** based on the `book.settings.printFormat` chosen during creation.

*   **If Created as Square (1:1):**
    *   Show: `7.5x7.5`, `8x8`
    *   Hide: `8x10` (or show as disabled with "Incompatible Format" note)
*   **If Created as Portrait (3:4):**
    *   Show: `8x10` (and `6x9` if we add it)
    *   Hide: `7.5x7.5`, `8x8`

This ensures the physical product matches the digital design perfectly.

---

## 4. UI/UX Polish

*   **Pricing Clarity**: Show estimated price ranges earlier in the creation flow if possible (e.g. "Starts at $12.99").
*   **Consistent Terminology**: Ensure "Theme" (Adventure, Space) is distinct from "Style" (Story complexity).

## Implementation Checklist

### Phase 1: Creation Flow Updates
- [ ] Rename `BookType` interface values to semantic content types (e.g. `simple_words`, `picture_story`).
- [ ] Update `app/page.tsx` UI to reflect "Story Style" labels.
- [ ] Update prompts in `lib/gemini/client.ts` to respect new content styles (e.g. force repetition for `simple_words`).

### Phase 2: Order Logic Update
- [ ] Modify `app/create/[bookId]/order/page.tsx` to read `book.settings.printFormat`.
- [ ] Implement filtered list of sizes (`SIZE_OPTIONS`).
- [ ] Auto-select the first valid size for the format.

### Phase 3: Visual Polish
- [ ] Add "Text Preview" tooltips to the Story Style selection cards.
