-- Add preview metadata for books

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS is_preview BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS preview_page_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_page_count INTEGER DEFAULT 0;

-- Expand status check to include preview
ALTER TABLE books DROP CONSTRAINT IF EXISTS books_status_check;
ALTER TABLE books
  ADD CONSTRAINT books_status_check
  CHECK (status IN ('preview', 'draft', 'completed', 'ordered'));
