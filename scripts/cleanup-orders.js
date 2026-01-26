
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupOrders() {
    console.log('Cleaning up orders...');

    // Keep the most recent SUCCESS order (ID: 1a0c6d3f based on previous log)
    // Or just keep the latest ONE success order.

    // 1. Get all orders sorted by date
    const { data: orders, error } = await supabase
        .from('orders')
        .select('id, status, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching orders:', error);
        return;
    }

    // Find the latest successful one
    const latestSuccess = orders.find(o => o.status === 'paid'); // 'paid' was the status in the log for SUCCESS fulfillment

    if (!latestSuccess) {
        console.log('No successful orders found to keep.');
        return;
    }

    console.log(`Keeping Order ID: ${latestSuccess.id} (Latest Paid)`);

    // IDs to delete: All except latestSuccess
    const idsToDelete = orders
        .filter(o => o.id !== latestSuccess.id)
        .map(o => o.id);

    if (idsToDelete.length === 0) {
        console.log('No orders to delete.');
        return;
    }

    console.log(`Deleting ${idsToDelete.length} orders...`);

    const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .in('id', idsToDelete);

    if (deleteError) {
        console.error('Error deleting:', deleteError);
    } else {
        console.log('Cleanup complete!');
    }
}

cleanupOrders();
