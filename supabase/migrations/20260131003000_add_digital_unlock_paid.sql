-- Track digital unlock payments

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS digital_unlock_paid BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS digital_unlock_session_id TEXT;
