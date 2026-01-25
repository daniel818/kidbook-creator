const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function main() {
    try {
        await client.connect();
        const res = await client.query(`
            SELECT 
                id, 
                created_at, 
                status, 
                fulfillment_status, 
                lulu_print_job_id, 
                fulfillment_error 
            FROM public.orders 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        console.log('Latest Orders:');
        res.rows.forEach(r => console.log(r));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

main();
