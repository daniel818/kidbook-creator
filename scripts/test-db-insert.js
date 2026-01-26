const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Force use of Service Role Key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars:', { supabaseUrl, hasKey: !!supabaseKey });
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function testInsert() {
    console.log('Testing Admin Insert...');
    console.log('URL:', supabaseUrl);

    // 1. Get a user ID
    const { data: { users }, error: uErr } = await supabase.auth.admin.listUsers();
    if (uErr) {
        console.error('List Users Error:', uErr);
        return;
    }
    if (!users || users.length === 0) {
        console.log('No users found. Creating a dummy user is too risky. Aborting.');
        return;
    }
    const userId = users[0].id;
    console.log('Using User ID:', userId);

    // 2. Get a book ID
    const { data: books, error: bErr } = await supabase.from('books').select('id').limit(1);
    if (bErr) {
        console.error('List Books Error:', bErr);
        return;
    }
    if (!books || books.length === 0) {
        console.log('No books found.');
        return;
    }
    const bookId = books[0].id;

    // 3. Insert Order
    const { data, error } = await supabase.from('orders').insert({
        book_id: bookId,
        user_id: userId,
        format: 'softcover',
        size: '8x8',
        quantity: 1,
        status: 'test_insert',
        shipping_full_name: 'Test Admin',
        shipping_address_line1: '123 Admin St',
        shipping_city: 'Admin City',
        shipping_state: 'NY',
        shipping_postal_code: '10001',
        shipping_country: 'US',
        shipping_phone: '555-555-5555',
        subtotal: 10,
        shipping_cost: 5,
        total: 15
    }).select();

    if (error) {
        console.error('INSERT FAILED:', error);
    } else {
        console.log('INSERT SUCCESS. Order ID:', data[0].id);

        // Cleanup
        await supabase.from('orders').delete().eq('id', data[0].id);
        console.log('Cleanup: Test order deleted.');
    }
}

testInsert();
