# Cost Calculation & Tracking Plan 💰

## Objective
Accurately calculate and track the exact cost of generating each book. This involves capturing token usage for text models (Gemini) and generation counts for image models (Imagen), applying unit costs, and storing this data for reporting.

## 1. Cost Drivers & Pricing Models

We are using the following models. *Note: Prices below are estimates based on standard public preview/GA pricing. Actual billing may vary.*

| Feature | Model | Unit | Estimated Price |
| :--- | :--- | :--- | :--- |
| **Story Text** | `gemini-3-flash` | Tokens | Input: ~$0.10 / 1M<br>Output: ~$0.40 / 1M |
| **Vision (Char Look)** | `gemini-3-flash` | Tokens | Input (Image+Text): ~$0.10 / 1M |
| **Illustrations (Ref)** | `gemini-3-pro-image` | Per Image | ~$0.04 / image |
| **Illustrations (Std)** | `imagen-3.0` | Per Image | ~$0.04 / image |

*Rough Estimate per Book (10 pages):*
- Text: ~2k input, ~1k output tokens = Negligible (<$0.001)
- Images: 10 pages + 1 cover = 11 images * $0.04 = ~$0.44
- **Total: ~$0.45 per book**

## 2. Database Schema Changes

We need to track every generation event to get an accurate total.

### New Table: `generation_logs`
Links to a `book_id` and records every API call.

```sql
create table generation_logs (
  id uuid default uuid_generate_v4() primary key,
  book_id uuid references books(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  
  -- Request Details
  step_name text, -- 'story_generation', 'character_extraction', 'illustration_page_1', etc.
  model_name text not null, -- 'gemini-3-flash-preview', 'imagen-3.0-generate-001'
  
  -- Usage metrics
  input_tokens int default 0,
  output_tokens int default 0,
  image_count int default 0,
  
  -- Calculated Cost (Populated by app logic)
  cost_usd numeric(10, 6) default 0
);
```

### Update Table: `books`
Add a cached total for easy display.
```sql
alter table books add column estimated_cost numeric(10, 6) default 0;
```

## 3. Implementation Plan

### Phase 1: Client Return Types
Refactor `lib/gemini/client.ts` functions to return **Metadata** alongside content.

1.  **`generateStory`**:
    *   Return `{ story: GeneratedStory, usage: { inputTokens, outputTokens, model } }`
    *   Capture `response.usageMetadata` from Gemini API.
2.  **`generateIllustration`**:
    *   Return `{ imageUrl: string, usage: { model, imageCount: 1 } }`
3.  **`generateCompleteBook`**:
    *   Aggregate all usage logs into a list: `GenerationLogItem[]`.
    *   Return this list to the API route.

### Phase 2: Server-Side Logging
In `app/api/ai/generate-book/route.ts`:
1.  Receive the `logs` from `generateCompleteBook`.
2.  Calculate `cost_usd` for each log based on a `PRICING_TABLE` constant.
3.  Insert all logs into `generation_logs` table.
4.  Sum total and update `books.estimated_cost`.

### Phase 3: UI Display
1.  Add a "Cost" badge in the `BookViewer` (visible only to admins or debug mode).
2.  Or a simple "Generation Stats" modal showing breakdown.

## 4. Next Steps
1.  Create Supabase Migration for `generation_logs`.
2.  Refactor `lib/gemini/client.ts` to capture usage.
3.  Implement logging logic in API route.
