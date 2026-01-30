-- ============================================
-- Migration: Orders Table Architecture Improvements
-- Date: 2026-01-30
-- Description: Clarifies status fields, adds delivery estimates,
--              shipped timestamp, and order status history table
-- ============================================

-- ============================================
-- STEP 1: Rename 'status' to 'payment_status' for clarity
-- ============================================

-- First, drop the old constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Rename the column
ALTER TABLE orders RENAME COLUMN status TO payment_status;

-- Add updated constraint with payment-only values
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check
CHECK (payment_status IN (
  'pending',        -- Awaiting payment
  'paid',           -- Payment successful
  'payment_failed', -- Payment failed
  'refunded',       -- Payment refunded
  'cancelled'       -- Order cancelled before payment
));

-- Create index for payment status queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- ============================================
-- STEP 2: Add Delivery Estimate Columns
-- ============================================

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS estimated_delivery_min DATE,
ADD COLUMN IF NOT EXISTS estimated_delivery_max DATE;

COMMENT ON COLUMN orders.estimated_delivery_min IS 'Earliest expected delivery date from Lulu shipping option';
COMMENT ON COLUMN orders.estimated_delivery_max IS 'Latest expected delivery date from Lulu shipping option';

-- ============================================
-- STEP 3: Add Shipped Timestamp
-- ============================================

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;

COMMENT ON COLUMN orders.shipped_at IS 'Timestamp when order was marked as shipped by Lulu webhook';

-- ============================================
-- STEP 4: Create Order Status History Table
-- ============================================

CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  
  -- Status change details
  status_type TEXT NOT NULL CHECK (status_type IN ('payment', 'fulfillment', 'lulu')),
  old_status TEXT,
  new_status TEXT NOT NULL,
  
  -- Change metadata
  changed_by TEXT NOT NULL DEFAULT 'system', -- 'webhook', 'admin', 'system', 'stripe'
  change_reason TEXT,
  
  -- Timestamp
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for order history queries
CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_changed_at ON order_status_history(changed_at);

-- RLS for order history (users can view history of their own orders)
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view history of own orders" ON order_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_status_history.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- ============================================
-- STEP 5: Create Trigger for Auto-Logging Status Changes
-- ============================================

CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log payment status changes
  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    INSERT INTO order_status_history (order_id, status_type, old_status, new_status, changed_by)
    VALUES (NEW.id, 'payment', OLD.payment_status, NEW.payment_status, 'system');
  END IF;
  
  -- Log fulfillment status changes
  IF OLD.fulfillment_status IS DISTINCT FROM NEW.fulfillment_status THEN
    INSERT INTO order_status_history (order_id, status_type, old_status, new_status, changed_by)
    VALUES (NEW.id, 'fulfillment', OLD.fulfillment_status, NEW.fulfillment_status, 'webhook');
  END IF;
  
  -- Log Lulu status changes
  IF OLD.lulu_status IS DISTINCT FROM NEW.lulu_status THEN
    INSERT INTO order_status_history (order_id, status_type, old_status, new_status, changed_by)
    VALUES (NEW.id, 'lulu', OLD.lulu_status, NEW.lulu_status, 'webhook');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS order_status_change_trigger ON orders;
CREATE TRIGGER order_status_change_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();

-- ============================================
-- STEP 6: Update Comments for Documentation
-- ============================================

COMMENT ON COLUMN orders.payment_status IS 'Payment state: pending, paid, payment_failed, refunded, cancelled';
COMMENT ON COLUMN orders.fulfillment_status IS 'Customer-facing fulfillment progress: pending, preparing, printing, shipped, delivered, failed';
COMMENT ON COLUMN orders.lulu_status IS 'Raw status from Lulu Print API webhooks';

-- ============================================
-- Summary of Changes
-- ============================================
-- 1. Renamed 'status' → 'payment_status' with payment-only values
-- 2. Added estimated_delivery_min/max columns
-- 3. Added shipped_at timestamp
-- 4. Created order_status_history table with RLS
-- 5. Created auto-logging trigger for status changes
