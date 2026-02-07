// ============================================
// Admin Stats API
// ============================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createModuleLogger } from '@/lib/logger';

const logger = createModuleLogger('admin-stats');

export async function GET() {
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

        // Get order statistics
        const { data: orders } = await supabase
            .from('orders')
            .select('id, total, status, created_at');

        const { data: users } = await supabase
            .from('profiles')
            .select('id, created_at');

        const { data: books } = await supabase
            .from('books')
            .select('id, status, created_at');

        // Calculate stats
        const totalOrders = orders?.length || 0;
        const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
        const totalUsers = users?.length || 0;
        const totalBooks = books?.length || 0;

        // Orders by status
        const ordersByStatus: Record<string, number> = {};
        orders?.forEach(o => {
            ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
        });

        // Recent orders (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentOrders = orders?.filter(o =>
            new Date(o.created_at) >= sevenDaysAgo
        ).length || 0;

        // Revenue this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const monthlyRevenue = orders?.filter(o =>
            new Date(o.created_at) >= startOfMonth
        ).reduce((sum, o) => sum + Number(o.total), 0) || 0;

        return NextResponse.json({
            totalOrders,
            totalRevenue,
            totalUsers,
            totalBooks,
            recentOrders,
            monthlyRevenue,
            ordersByStatus,
        });
    } catch (error) {
        logger.error({ err: error }, 'Stats error');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
