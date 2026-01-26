const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function main() {
    try {
        await client.connect();
        const res = await client.query('SELECT * FROM public.orders ORDER BY created_at DESC');
        console.log(`Total Orders: ${res.rows.length}`);
        res.rows.forEach(r => {
            console.log(`[${r.created_at}] ID: ${r.id}, Status: ${r.status}, Fullfill: ${r.fulfillment_status}, LuluJob: ${r.lulu_print_job_id}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

main();
