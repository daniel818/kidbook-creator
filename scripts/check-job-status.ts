
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createLuluClient } from '../lib/lulu/client';

async function main() {
    const jobId = process.argv[2] || '274862'; // Default to the one in the screenshot
    console.log(`--- Checking Status for Print Job ${jobId} ---`);

    const client = createLuluClient();

    try {
        const response: any = await (client as any).request('GET', `/print-jobs/${jobId}/`);

        console.log(`Status: ${response.status.name}`);
        console.log(`Created: ${response.date_created}`);

        if (response.line_items && response.line_items.length > 0) {
            const item = response.line_items[0];
            console.log('\n--- Line Item ---');
            console.log(`Title: ${item.title}`);
            console.log(`Status: ${item.status ? item.status.name : 'Unknown'}`);
            console.log(`Printable ID: ${item.printable_id}`); // This matches what user saw as null

            if (item.printable_normalization) {
                console.log('\n--- File Issues (Normalization) ---');
                console.log(JSON.stringify(item.printable_normalization, null, 2));
            }
        }

    } catch (err) {
        console.error('Error fetching job:', err);
    }
}

main().catch(console.error);
