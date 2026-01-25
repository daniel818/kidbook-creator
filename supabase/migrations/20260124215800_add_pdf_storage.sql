-- Create private bucket for book PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('book-pdfs', 'book-pdfs', false, 524288000, ARRAY['application/pdf']) -- 500MB limit
ON CONFLICT (id) DO NOTHING;

-- Add cover_pdf_url to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS cover_pdf_url TEXT;

-- Enable RLS on storage.objects if not enabled (it usually is)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can upload to book-pdfs
DO $$
BEGIN
    CREATE POLICY "Authenticated users can upload PDFs"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'book-pdfs');
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN insufficient_privilege THEN null; -- Ignore if we can't set policy
END $$;

-- Policy: Users can read their own PDFs
DO $$
BEGIN
    CREATE POLICY "Users can read own PDFs"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'book-pdfs' AND owner = auth.uid());
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN insufficient_privilege THEN null;
END $$;

-- Policy: Admin can read all files (required for fulfillment script)
-- (Supabase Service Role bypasses RLS, so this might not be strictly needed, but good practice)
