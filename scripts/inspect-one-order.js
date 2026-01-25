
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectOrder() {
    const { data: order, error } = await supabase
        .from('orders')
        .select(`
      id,
      total,
      subtotal,
      shipping_cost,
      books (
        id,
        title,
        thumbnail_url
      )
    `)
        .eq('id', '1a0c6d3f-3d35-4064-a48d-07797c17fc51')
        .single();

    if (error) {
        console.error(error);
    } else {
        console.log('Order Data:', JSON.stringify(order, null, 2));
    }
}

inspectOrder();
