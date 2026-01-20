# Server-Side Book Creation Flow

This document details the end-to-end process of how a book is generated on the server, triggered by the client application.

## 1. Client-Side Trigger

The process begins in `app/create/page.tsx`. When the user clicks "Create Book":

1.  **Character Extraction (Optional)**: If a photo is uploaded, the client calls `/api/ai/extract-character` to get a text description of the child's features using **Gemini 2.0 Flash**.
2.  **Request Construction**: The client packages all settings (name, age, theme, type, print format, etc.) and the base64-encoded child photo (if any) into a JSON payload.
3.  **API Call**: Parameters are sent via POST to `/api/ai/generate-book`.

## 2. API Endpoint: `/api/ai/generate-book`

The main logic resides in `app/api/ai/generate-book/route.ts`.

### Step 2.1: Validation & Authentication
- **Validation**: Checks for required fields (`childName`, `bookTheme`, `bookType`).
- **Auth**: Verifies the user's session using Supabase Auth.
- **Format Logic**: Determines the aspect ratio (`1:1` for 'square', `3:4` for 'portrait') based on the `printFormat` parameter.

### Step 2.2: AI Generation Pipeline

The API calls `generateCompleteBook` from `lib/gemini/client.ts`. This runs the following sequence:

1.  **Story Generation**:
    -   **Model**: `gemini-3-flash-preview`
    -   **Prompt**: A structured prompt requests a JSON response containing the book title, back cover blurb, character description, and a list of pages. Each page includes the story text and a detailed `imagePrompt`.

2.  **Illustration Generation**:
    -   The system iterates through each page to generate an illustration.
    -   **Mode A (Photo Reference)**: If a child photo is provided, it uses **Gemini 3 Pro Image Preview** (`gemini-3-pro-image-preview`) with the photo to maintain character consistency.
    -   **Mode B (Standard)**: If no photo is provided, it uses **Imagen 4** (`imagen-4.0-generate-001`) or **Imagen 4 Ultra** (`imagen-4.0-generate-ultra-001`) based on quality settings.

### Step 2.3: Asset Storage

Once images are generated (returned as base64 strings):

1.  **Iterative Upload**: The API loops through the generated base64 images.
2.  **Storage**: Uploads each image to the Supabase Storage bucket `book-images` using the path structure: `{userId}/{bookId}/{pageIndex}.png`.
3.  **URL Replacement**: The local data structure is updated to point to the public Supabase URLs instead of base64 strings.

### Step 2.4: Database Persistence

Data is saved to the Supabase PostgreSQL database:

1.  **`books` Table**: A new record is created with metadata (title, child name, print format, etc.).
2.  **Page Mapping**: The generation result is transformed into `pages` table rows.
    -   **Page Types**: The first page is marked as `cover`.
    -   **Elements**: Text and Image content are stored as JSON arrays in `text_elements` and `image_elements` columns.
3.  **`pages` Table**: All page rows are inserted into the database.

## 3. Completion

-   The API returns a `{ success: true, bookId: ... }` response.
-   The Client receives the `bookId` and redirects the user to `/book/[bookId]` to view their newly created story.
