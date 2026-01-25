import { fulfillOrder } from '../lib/lulu/fulfillment';
import { createAdminClient } from '../lib/supabase/server';

async function main() {
    console.log('--- Manual Fulfillment ---');
    const supabase = await createAdminClient();

    // Get latest pending order
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'paid')
        .neq('fulfillment_status', 'SUCCESS')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error || !orders || orders.length === 0) {
        console.error('No pending orders found to fulfill.');
        return;
    }

    const order = orders[0];
    console.log(`Fulfilling Order: ${order.id} (Created: ${order.created_at})`);

    try {
        const result = await fulfillOrder(order.id);
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('Fulfillment Failed:', err);
    }
}

main();
