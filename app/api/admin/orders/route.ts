// ============================================
// Admin Orders API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createRequestLogger } from '@/lib/logger';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

// GET /api/admin/orders - Get all orders with filtering
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check if user is admin
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (!profile?.is_admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Rate limit admin API calls
        const rateResult = checkRateLimit(`standard:${user.id}`, RATE_LIMITS.standard);
        if (!rateResult.allowed) {
            const loggerRL = createRequestLogger(request);
            loggerRL.info({ userId: user.id }, 'Rate limited: admin/orders GET');
            return rateLimitResponse(rateResult);
        }

        // Get query params
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Build query
        let query = supabase
            .from('orders')
            .select(`
        *,
        books (id, title, child_name),
        profiles:user_id (email, full_name)
      `)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data: orders, error, count } = await query;

        if (error) {
            const logger = createRequestLogger(request);
            logger.error({ err: error }, 'Error fetching orders');
            return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
        }

        return NextResponse.json({
            orders: orders || [],
            total: count || orders?.length || 0,
            limit,
            offset,
        });
    } catch (error) {
        const logger = createRequestLogger(request);
        logger.error({ err: error }, 'Admin orders error');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
