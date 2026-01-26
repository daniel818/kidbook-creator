const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
    console.error("Missing SERVICE ROLE KEY");
    process.exit(1);
}

async function verifyStorage() {
    console.log('--- Verifying Storage via Raw Fetch ---');
    const bucket = 'book-pdfs';
    const fileName = `test-${Date.now()}.txt`;
    const content = 'Hello Storage World';

    // 1. Upload
    console.log('1. Uploading...');
    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${fileName}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'text/plain',
        },
        body: content
    });

    if (!uploadRes.ok) {
        console.error('Upload Failed:', await uploadRes.text());
        return;
    }
    console.log('Upload Success');

    // 2. Download
    console.log('2. Downloading...');
    const downloadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${fileName}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${SERVICE_KEY}`,
        }
    });

    if (!downloadRes.ok) {
        console.error('Download Failed:', await downloadRes.text());
        return;
    }

    const text = await downloadRes.text();
    console.log('Download Success. Content:', text);
    if (text !== content) {
        console.error('Startled! Content mismatch.');
    }

    // 3. Cleanup
    console.log('3. Cleanup...');
    const deleteRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${fileName}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${SERVICE_KEY}`,
        }
    });

    if (deleteRes.ok) console.log('Cleanup Success');
    else console.error('Cleanup Failed');
}

verifyStorage();
