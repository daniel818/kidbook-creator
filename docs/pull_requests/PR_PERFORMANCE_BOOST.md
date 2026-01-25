# Pull Request: Performance Boost (Parallel Generation)

## Summary
Optimizes book generation speed by parallelizing the image generation process, significantly reducing total wait time.

## Changes
- **Parallelization**: 
  - Refactored `lib/gemini/client.ts` to generate illustrations in batches (Concurrency: 3).
- **Rate Limiting**: 
  - Introduced `SAFETY_DELAY_MS` (2000ms) between batches to respect API rate limits and ensure reliability.
- **Lint Fixes**:
  - Resolved `AuthModal` prop type mismatch in `app/page.tsx`.

## Branch
`feature/performance-boost` (Base: `feature/cost-estimation`)

## Verification
- **Speed**: Observed approximately 3x speedup in image generation phase.
- **Stability**: Confirmed that rate limit delays prevent 429 errors.
- **History**: Rebased cleanly onto `feature/cost-estimation` to maintain a linear history.
