
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createLuluClient } from '../lib/lulu/client';

async function main() {
    console.log('--- Listing Lulu Products ---');

    const client = createLuluClient();
    // Use the raw request method since listProducts might not be typed exposed
    // We'll access the private-like request method or cast to any

    try {
        console.log('Fetching products...');
        // The endpoint is likely /print-products/
        const response: any = await (client as any).request('GET', '/print-products/?limit=200');

        console.log(`Found ${response.results?.length} products.`);

        // Filter for 8.5x8.5 (0850X0850)
        const relevant = response.results.filter((p: any) => p.code.includes('0850X0850'));

        console.log('\n--- Relevant 8.5x8.5 Products ---');
        relevant.forEach((p: any) => {
            console.log(`${p.code} - ${p.name || 'No Name'}`);
        });

        if (relevant.length === 0) {
            console.log('No 8.5x8.5 matches. Listing all square ones (X0850 or X0600):');
            response.results.filter((p: any) => p.code.includes('0600X0600')).forEach((p: any) => {
                console.log(`${p.code} - ${p.name}`);
            });
        }

    } catch (err) {
        console.error('Error listing products:', err);
        if ((err as any).response) {
            console.error('Response:', JSON.stringify((err as any).response.data, null, 2));
        }
    }
}

main().catch(console.error);
