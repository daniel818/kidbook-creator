ALTER TABLE public.books
ADD COLUMN IF NOT EXISTS digital_unlock_email_sent boolean DEFAULT false;
