const { Client } = require('pg');

const connectionString = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function reloadSchema() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Reloading PostgREST schema cache...');
        await client.query("NOTIFY pgrst, 'reload schema'");
        console.log('Reload signal sent.');
    } catch (err) {
        console.error('Failed to reload schema:', err);
    } finally {
        await client.end();
    }
}

reloadSchema();
