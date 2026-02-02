-- Store generation metadata for preview unlocks

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS character_description TEXT,
  ADD COLUMN IF NOT EXISTS art_style TEXT,
  ADD COLUMN IF NOT EXISTS image_quality TEXT,
  ADD COLUMN IF NOT EXISTS story_description TEXT;

ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS image_prompt TEXT;
