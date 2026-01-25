const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function main() {
    try {
        await client.connect();

        // 1. Get User
        const resUser = await client.query('SELECT id FROM auth.users LIMIT 1');
        if (resUser.rows.length === 0) throw new Error('No users found');
        const userId = resUser.rows[0].id;
        console.log('User ID:', userId);

        // 2. Get Book
        const resBook = await client.query('SELECT id FROM public.books LIMIT 1');
        if (resBook.rows.length === 0) throw new Error('No books found');
        const bookId = resBook.rows[0].id;
        console.log('Book ID:', bookId);

        // 3. Insert Order
        const query = `
            INSERT INTO public.orders (
                book_id, user_id, format, size, quantity,
                shipping_full_name, shipping_address_line1, shipping_city, 
                shipping_state, shipping_postal_code, shipping_country, shipping_phone,
                status, fulfillment_status, subtotal, shipping_cost, total
            ) VALUES (
                $1, $2, 'softcover', '8x8', 1,
                'PG Tester', '123 DB Direct', 'Direct City', 
                'NY', '10001', 'US', '555-000-0000',
                'pending', 'PENDING', 10.00, 5.00, 15.00
            ) RETURNING id;
        `;

        const resInsert = await client.query(query, [bookId, userId]);
        console.log('INSERT SUCCESS:', resInsert.rows[0]);

    } catch (err) {
        console.error('INSERT FAILED:', err);
    } finally {
        await client.end();
    }
}

main();
