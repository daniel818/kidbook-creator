const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function main() {
    try {
        await client.connect();
        // Update the most recent order to 'paid' (ID 9e65...)
        const res = await client.query(`
            UPDATE public.orders 
            SET status = 'paid' 
            WHERE id = (SELECT id FROM public.orders ORDER BY created_at DESC LIMIT 1)
            RETURNING id, status;
        `);
        console.log('Update Result:', res.rows[0]);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

main();
