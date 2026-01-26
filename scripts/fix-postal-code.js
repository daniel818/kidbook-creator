const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function main() {
    try {
        await client.connect();
        const res = await client.query(`
            SELECT id, shipping_postal_code 
            FROM public.orders 
            WHERE id = '12497c0c-5876-4a6a-ac5b-2265b37f2ba8'
        `);
        console.log('Order Data:', res.rows[0]);

        if (res.rows[0] && !res.rows[0].shipping_postal_code) {
            console.log('Updating postal code...');
            await client.query(`
                UPDATE public.orders
                SET shipping_postal_code = '10001'
                WHERE id = '12497c0c-5876-4a6a-ac5b-2265b37f2ba8'
             `);
            console.log('Update Complete.');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

main();
