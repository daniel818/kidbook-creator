ALTER TABLE books
ADD COLUMN IF NOT EXISTS child_gender TEXT CHECK (child_gender IN ('boy', 'girl', 'other'));
