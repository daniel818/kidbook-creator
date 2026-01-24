# ⚠️ Database Migration Required

## Issue
Book generation is failing with error:
```
Could not find the 'language' column of 'books' in the schema cache
```

## Solution
Run the migration file that adds the `language` column to the `books` table.

## Steps to Fix

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the following SQL:

```sql
-- Add language column to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en' CHECK (language IN ('en', 'de', 'he'));

-- Add comment
COMMENT ON COLUMN books.language IS 'Language of the book content (en=English, de=German, he=Hebrew)';
```

### Option 2: Via Migration File
The migration file already exists at:
`supabase/migrations/20260124000000_add_language_to_books.sql`

If you're using Supabase CLI:
```bash
supabase db push
```

## Verify
After running the migration, test by creating a new book. The generation should complete successfully and save the language field.

## What This Fixes
- ✅ Book generation 500 errors
- ✅ Language persistence in database
- ✅ Proper language display in book viewer
- ✅ Cover page and back cover translations based on book language
