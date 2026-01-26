const { Client } = require('pg');

const connectionString = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function checkLatestCost() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        const res = await client.query(`
            SELECT title, id, created_at, estimated_cost 
            FROM books 
            ORDER BY created_at DESC 
            LIMIT 1
        `);

        if (res.rows.length > 0) {
            console.log('Latest Book:', res.rows[0]);
        } else {
            console.log('No books found.');
        }

        const logs = await client.query(`
            SELECT step_name, cost_usd 
            FROM generation_logs 
            WHERE book_id = $1
            ORDER BY id ASC
        `, [res.rows[0].id]);

        console.log('Generation Logs Count:', logs.rowCount);
        // console.log(logs.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkLatestCost();
