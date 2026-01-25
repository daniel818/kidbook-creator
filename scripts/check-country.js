const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function main() {
    try {
        await client.connect();
        const res = await client.query(`
            SELECT id, shipping_country, shipping_postal_code
            FROM public.orders 
            WHERE id = '12497c0c-5876-4a6a-ac5b-2265b37f2ba8'
        `);
        console.log('Order Data:', res.rows[0]);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

main();
