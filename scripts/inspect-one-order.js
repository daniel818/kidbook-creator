
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
      created_at,
      status, // Payment status
      total,
      subtotal,
      subtotal,
      shipping_cost,
      pdf_url,
      cover_pdf_url,
      fulfillment_status,
      books (
        id,
        title,
        thumbnail_url
      )
    `)
        .eq('status', 'paid')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error(error);
    } else {
        console.log('Order Data:', JSON.stringify(order, null, 2));
    }
}

inspectOrder();
