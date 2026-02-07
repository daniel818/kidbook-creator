
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createLuluClient } from '../lib/lulu/client';
import { createModuleLogger } from '../lib/logger';

const logger = createModuleLogger('script:list-products');

async function main() {
    logger.info('--- Listing Lulu Products ---');

    const client = createLuluClient();
    // Use the raw request method since listProducts might not be typed exposed
    // We'll access the private-like request method or cast to any

    try {
        logger.info('Fetching products...');
        // The endpoint is likely /print-products/
        const response: any = await (client as any).request('GET', '/print-products/?limit=200');

        logger.info({ count: response.results?.length }, 'Found products');

        // Filter for 8.5x8.5 (0850X0850)
        const relevant = response.results.filter((p: any) => p.code.includes('0850X0850'));

        logger.info({ count: relevant.length }, '--- Relevant 8.5x8.5 Products ---');
        relevant.forEach((p: any) => {
            logger.info({ code: p.code, name: p.name || 'No Name' }, 'Product');
        });

        if (relevant.length === 0) {
            logger.info('No 8.5x8.5 matches. Listing all square ones (X0850 or X0600):');
            response.results.filter((p: any) => p.code.includes('0600X0600')).forEach((p: any) => {
                logger.info({ code: p.code, name: p.name }, 'Product');
            });
        }

    } catch (err) {
        logger.error({ err }, 'Error listing products');
        if ((err as any).response) {
            logger.error({ responseData: (err as any).response.data }, 'Response');
        }
    }
}

main().catch((err) => logger.error({ err }, 'Unhandled error'));
