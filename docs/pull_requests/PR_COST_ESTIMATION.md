# Pull Request: Cost Calculation System

## Summary
Introduces a comprehensive system for tracking and estimating book generation costs using Gemini and Imagen models.

## Changes
- **Database Schema**: 
  - Added `generation_logs` table to store detailed usage metrics.
  - Added `estimated_cost` column to `books` table.
- **Client Library**: 
  - Updated `lib/gemini/client.ts` to return `UsageMetadata` for `generateStory` and `generateIllustration`.
- **API**: 
  - `POST /api/ai/generate-book` now calculates costs based on usage logs and updates the database.
- **UI**: 
  - Added a "Cost Badge" to `StoryBookViewer` header to display the real-time cost.

## Branch
`feature/cost-estimation` (Base: `main`)

## Notes
- Image generation remains **sequential** in this branch to simplify the cost logic implementation and ensure baseline stability.
- Includes SQL migration file `supabase/migrations/20260120221400_add_generation_logs.sql`.
