-- Migration: Add enhanced tracking columns for Lulu webhook data
-- Run this in Supabase SQL Editor or via migration

-- Add new columns for carrier and direct tracking URL
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS carrier_name TEXT,
ADD COLUMN IF NOT EXISTS tracking_url TEXT;

-- Update fulfillment_status constraint to include new statuses
-- First, drop the existing constraint
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_fulfillment_status_check;

-- Add updated constraint with all statuses
ALTER TABLE orders
ADD CONSTRAINT orders_fulfillment_status_check
CHECK (fulfillment_status IN (
  -- Initial/pending states
  'pending', 'PENDING',
  -- PDF generation states (client-side)
  'GENERATING_PDFS', 'UPLOADING', 'CREATING_JOB',
  -- Processing states (after job created)
  'processing',
  -- Pre-production states
  'preparing',   -- PRODUCTION_DELAYED, PRODUCTION_READY
  -- Production states
  'printing',    -- IN_PRODUCTION
  -- Fulfillment states
  'shipped',     -- SHIPPED
  'delivered',   -- After delivery confirmation
  -- Error states
  'cancelled',   -- CANCELED
  'failed',      -- ERROR
  -- Legacy states (for backwards compatibility)
  'SUCCESS', 'FAILED'
));

-- Add index for carrier_name for potential filtering
CREATE INDEX IF NOT EXISTS idx_orders_carrier_name ON orders(carrier_name);

-- Add comment for documentation
COMMENT ON COLUMN orders.carrier_name IS 'Shipping carrier name from Lulu API (e.g., UPS, FedEx, USPS, DHL)';
COMMENT ON COLUMN orders.tracking_url IS 'Direct tracking URL from Lulu API - use this instead of constructing URLs';
COMMENT ON COLUMN orders.tracking_number IS 'Tracking ID/number from carrier';
