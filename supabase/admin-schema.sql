-- ============================================
-- KidBook Creator - Admin Schema Migration
-- ============================================
-- Run this after the main schema.sql
-- ============================================

-- Add is_admin column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index for admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = TRUE;

-- ============================================
-- Admin RLS Policies
-- ============================================

-- Admins can view all orders
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- Admins can update all orders
CREATE POLICY "Admins can update all orders" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- Admins can view all books
CREATE POLICY "Admins can view all books" ON books
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- ============================================
-- Make a user admin (replace with your user ID)
-- ============================================
-- UPDATE profiles SET is_admin = TRUE WHERE id = 'your-user-uuid-here';
