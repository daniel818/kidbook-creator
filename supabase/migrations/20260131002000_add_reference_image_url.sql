-- Add reference image url for consistent unlock generation

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS reference_image_url TEXT;
