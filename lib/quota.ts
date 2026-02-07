import { SupabaseClient } from '@supabase/supabase-js';

export const PREVIEW_QUOTA_BASE = 3;
export const BONUS_PER_PURCHASE = 2;

export interface QuotaInfo {
  base: number;
  bonus: number;
  total: number;
  used: number;
  remaining: number;
}

/**
 * Calculate a user's preview generation quota from existing DB columns.
 * Formula: remaining = (PREVIEW_QUOTA_BASE + purchases * BONUS_PER_PURCHASE) - previews_created
 * Purchases = paid orders + digital unlocks (counted separately since each is a separate payment).
 */
export async function calculateQuota(
  userId: string,
  supabase: SupabaseClient
): Promise<QuotaInfo> {
  const [previewResult, ordersResult, unlocksResult] = await Promise.all([
    // Count preview books created by this user
    supabase
      .from('books')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_preview', true),

    // Count paid print orders
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('payment_status', 'paid'),

    // Count digital unlocks
    supabase
      .from('books')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('digital_unlock_paid', true),
  ]);

  const used = previewResult.count ?? 0;
  const paidOrders = ordersResult.count ?? 0;
  const digitalUnlocks = unlocksResult.count ?? 0;
  const purchases = paidOrders + digitalUnlocks;
  const bonus = purchases * BONUS_PER_PURCHASE;
  const total = PREVIEW_QUOTA_BASE + bonus;
  const remaining = Math.max(0, total - used);

  return {
    base: PREVIEW_QUOTA_BASE,
    bonus,
    total,
    used,
    remaining,
  };
}
