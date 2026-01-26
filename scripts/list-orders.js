const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listOrders() {
    console.log('Listing Orders...');

    // Select all orders
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`Found ${data.length} orders.`);
        data.forEach(order => {
            console.log(`- ID: ${order.id}`);
            console.log(`  Created: ${order.created_at}`);
            console.log(`  Status: ${order.status}`);
            console.log(`  Fulfillment: ${order.fulfillment_status}`);
            console.log(`  Lulu Job: ${order.lulu_print_job_id}`);
            console.log('---');
        });
    }
}

listOrders();
