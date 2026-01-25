-- Add missing columns for Lulu fulfillment
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS fulfillment_status TEXT DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS fulfillment_error TEXT,
ADD COLUMN IF NOT EXISTS lulu_print_job_id TEXT,
ADD COLUMN IF NOT EXISTS lulu_status TEXT;

-- Create index for faster lookups if needed (optional)
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON orders(fulfillment_status);
