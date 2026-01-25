const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function main() {
    try {
        await client.connect();
        const res = await client.query('SELECT * FROM storage.buckets');
        console.log(`Buckets: ${res.rows.length}`);
        res.rows.forEach(r => console.log(`- ${r.id} (Public: ${r.public})`));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

main();
