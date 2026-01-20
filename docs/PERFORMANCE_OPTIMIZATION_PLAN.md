# Optimize Book Generation Speed - Implementation Plan

## Goal
Reduce the total time required to create a book by parallelizing the image generation steps. Currently, images are generated one by one with a 1-second delay between them.

## Requirements
- **Parallelization**: Run 2-3 image generation requests concurrently.
- **Rate Limit Safety**: Respect API limits. If we hit limits, the system should ideally handle it or we should stay within safe bounds. User explicitly warned about rate limits ("doubt yourself").
- **Target Concurrency**: 3 concurrent requests.

## Proposed Changes

### [MODIFY] `lib/gemini/client.ts`

1.  **Remove Sequential Loop**: Replace the `for` loop that awaits each `generateIllustration` call.
2.  **Implement Batching/Concurrency**:
    -   Create a helper function `processInBatches` or use a specialized library pattern (like `p-limit` logic, but implemented simply).
    -   Chunk the pages into groups of 3.
    -   Process each chunk with `Promise.all`.
    -   Add a small delay (e.g., 1000ms) *between chunks* to be safe, rather than between every single request.

### Algorithm
```typescript
const CONCURRENCY_LIMIT = 3;
const results = new Array(story.pages.length);

// Helper to run a task with retries or error swallowing
const generatePageImage = async (index) => {
   // ... call generateIllustration ...
   // Store result in results[index]
}

// Process in chunks
for (let i = 0; i < story.pages.length; i += CONCURRENCY_LIMIT) {
    const chunk = story.pages.slice(i, i + CONCURRENCY_LIMIT);
    const promises = chunk.map((_, offset) => generatePageImage(i + offset));
    await Promise.all(promises);
    
    // Optional safety delay between batches
    if (i + CONCURRENCY_LIMIT < story.pages.length) {
         await new Promise(r => setTimeout(r, 1000)); 
    }
}
```

3.  **Progress Updates**:
    -   Update the `onProgress` callback to reflect the batch progress rather than per-page linear progress.

## Verification
-   Generate a book with 10 pages.
-   Observe the logs to ensure 3 requests start roughly at the same time.
-   Verify that all images are generated successfully (no 429 errors).
-   Compare total time (should be ~3x faster for the image generation phase).
