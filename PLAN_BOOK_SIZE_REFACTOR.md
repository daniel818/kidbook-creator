# Refactoring Book Size Selection

We need to move the book size selection to the beginning of the creation flow to ensure the generated content (images and layout) matches the intended physical format. This replaces the current "Square vs Portrait" toggle with a more specific size selection (6x6, 8x8, 8x10) that maps to the correct generation parameters.

## User Review Required
> [!IMPORTANT]
> **Database Migration Required**: This plan requires adding a new column `book_size` to the `books` table in Supabase. You will need to run the Provided SQL command in your Supabase SQL Editor.

## Proposed Changes

### Database
#### [MODIFY] [supabase/schema.sql](file:///Users/daniel/.gemini/antigravity/playground/kidbook-creator/supabase/schema.sql)
- Add `book_size` column to `books` table.
- update `books` table definition.

### Types & Logic
#### [MODIFY] [lib/types.ts](file:///Users/daniel/.gemini/antigravity/playground/kidbook-creator/lib/types.ts)
- Update `BookSettings` to include `bookSize: '6x6' | '8x8' | '8x10'`.
- Add helper maps/constants for Book Size details (label, aspect ratio, description).

### Frontend
#### [MODIFY] [app/create/page.tsx](file:///Users/daniel/.gemini/antigravity/playground/kidbook-creator/app/create/page.tsx)
- Replace the current 'format' step (Square vs Portrait) with a detailed "Choose Size" step.
- Options:
    - **6" x 6" Small Square** (Aspect: 1:1)
    - **8" x 8" Standard Square** (Aspect: 1:1)
    - **8" x 10" Portrait** (Aspect: 3:4)
- Add logic to recommend sizes based on the selected `bookType` (e.g., Board Books -> 6x6).

#### [MODIFY] [app/create/[bookId]/order/page.tsx](file:///Users/daniel/.gemini/antigravity/playground/kidbook-creator/app/create/[bookId]/order/page.tsx)
- Pre-select the size chosen during creation.
- Filter available sizes based on the original aspect ratio (don't show 8x10 if book was generated as Square).

### Backend / API
#### [MODIFY] [app/api/ai/generate-book/route.ts](file:///Users/daniel/.gemini/antigravity/playground/kidbook-creator/app/api/ai/generate-book/route.ts)
- Update to accept `bookSize` from the request body.
- Map `bookSize` to `aspectRatio` for the AI generation:
    - '6x6', '8x8' -> '1:1'
    - '8x10' -> '3:4'
- Persist `bookSize` to the new database column.
- Remove the "[Square]" title hack.

## Verification Plan

### Manual Verification
1.  **Database Update**:
    - Run the migration SQL.
    - Verify schema has `book_size` column.
2.  **Creation Flow**:
    - Go to `/create`.
    - Select different book types and verify recommended sizes.
    - Select "8x10 Portrait".
    - Complete generation.
    - Verify the generated book has portrait aspect ratio images.
3.  **Order Page**:
    - Click "Order Print".
    - Verify "8x10" is pre-selected.
    - Verify incompatible sizes (Square) are disabled or hidden.
