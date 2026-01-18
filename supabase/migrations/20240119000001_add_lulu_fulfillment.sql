-- ============================================
-- Migration: Add Lulu Fulfillment Fields to Orders
-- ============================================
-- Adds columns needed for Lulu print-on-demand integration

-- Add Lulu fulfillment columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS lulu_print_job_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS lulu_status TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_status TEXT DEFAULT 'pending' 
    CHECK (fulfillment_status IN ('pending', 'PENDING', 'GENERATING_PDFS', 'UPLOADING', 'CREATING_JOB', 'SUCCESS', 'FAILED'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_error TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_error TEXT;

-- Add index for fulfillment status queries
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_orders_lulu_print_job_id ON orders(lulu_print_job_id);

-- Update status constraint to include payment_failed
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('pending', 'paid', 'payment_failed', 'processing', 'printed', 'shipped', 'delivered', 'cancelled'));

COMMENT ON COLUMN orders.lulu_print_job_id IS 'Lulu API print job ID';
COMMENT ON COLUMN orders.lulu_status IS 'Current status from Lulu API';
COMMENT ON COLUMN orders.fulfillment_status IS 'Internal fulfillment pipeline status';
COMMENT ON COLUMN orders.fulfillment_error IS 'Error message if fulfillment failed';
