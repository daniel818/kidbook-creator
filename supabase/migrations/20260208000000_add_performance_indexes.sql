-- ============================================
-- Migration: Add Performance Indexes
-- Issue: #40
-- Date: 2026-02-08
-- Description: Add indexes to optimize critical query paths
--              including webhook lookups, user-facing list queries,
--              and admin dashboard pagination. Also removes a
--              stale duplicate index from a previous column rename.
-- ============================================

-- ============================================
-- STEP 1: Remove stale duplicate index
-- ============================================
-- idx_orders_status was created on the old 'status' column in the init migration.
-- Migration 20260130222500 renamed 'status' to 'payment_status', which causes
-- PostgreSQL to update the index internally. That same migration also created
-- idx_orders_payment_status explicitly, resulting in two identical indexes.
DROP INDEX IF EXISTS idx_orders_status;

-- ============================================
-- STEP 2: UNIQUE partial indexes for webhook lookups
-- (Highest priority — webhook latency critical path)
-- ============================================

-- Stripe checkout session ID
-- Used by: checkout.session.completed webhook, order confirmation page
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_stripe_checkout_session_id
ON orders(stripe_checkout_session_id)
WHERE stripe_checkout_session_id IS NOT NULL;

-- Stripe payment intent ID
-- Used by: payment_intent.succeeded and payment_intent.payment_failed webhooks
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent_id
ON orders(stripe_payment_intent_id)
WHERE stripe_payment_intent_id IS NOT NULL;

-- Lulu print job ID
-- Used by: Lulu webhook for all fulfillment status updates
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_lulu_print_job_id
ON orders(lulu_print_job_id)
WHERE lulu_print_job_id IS NOT NULL;

-- ============================================
-- STEP 3: Composite indexes for user-facing list queries
-- ============================================

-- User orders list sorted by date
-- Used by: GET /api/orders — .eq('user_id').order('created_at', desc)
CREATE INDEX IF NOT EXISTS idx_orders_user_id_created_at
ON orders(user_id, created_at DESC);

-- User books list sorted by last update
-- Used by: GET /api/books — .eq('user_id').order('updated_at', desc)
CREATE INDEX IF NOT EXISTS idx_books_user_id_updated_at
ON books(user_id, updated_at DESC);

-- Admin orders list with pagination
-- Used by: GET /api/admin/orders — .order('created_at', desc).range()
CREATE INDEX IF NOT EXISTS idx_orders_created_at
ON orders(created_at DESC);

-- ============================================
-- STEP 4: Composite index for checkout idempotency
-- ============================================

-- Find existing pending order for a book before creating a new one
-- Used by: POST /api/checkout/create-intent — .eq('book_id').eq('user_id').eq('payment_status', 'pending')
CREATE INDEX IF NOT EXISTS idx_orders_book_id_user_id_payment_status
ON orders(book_id, user_id, payment_status);

-- ============================================
-- STEP 5: Index for generation_logs
-- ============================================

-- Used by RLS policy subquery and future cost-tracking queries
CREATE INDEX IF NOT EXISTS idx_generation_logs_book_id
ON generation_logs(book_id);
