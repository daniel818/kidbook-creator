
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

async function inspectOrders() {
    console.log('Inspecting orders...');

    // Get all orders
    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
      id,
      user_id,
      status,
      lulu_status,
      fulfillment_status,
      created_at,
      total,
      format
    `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching orders:', error);
        return;
    }

    console.log(`Found ${orders.length} total orders.`);

    // Group by status
    const byStatus = {};
    orders.forEach(o => {
        const s = o.fulfillment_status || o.status;
        byStatus[s] = (byStatus[s] || 0) + 1;
    });
    console.log('Orders by Status:', byStatus);

    console.log('\n--- Recent 10 Orders ---');
    orders.slice(0, 10).forEach(o => {
        console.log(`ID: ${o.id.slice(0, 8)} | Status: ${o.status} | Fulfillment: ${o.fulfillment_status} | Lulu: ${o.lulu_status || 'N/A'} | Date: ${new Date(o.created_at).toISOString()}`);
    });
}

inspectOrders();
