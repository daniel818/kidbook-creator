-- Add language column to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en' CHECK (language IN ('en', 'de', 'he'));

-- Add comment
COMMENT ON COLUMN books.language IS 'Language of the book content (en=English, de=German, he=Hebrew)';
