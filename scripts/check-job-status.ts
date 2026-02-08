
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createLuluClient } from '../lib/lulu/client';
import { createModuleLogger } from '../lib/logger';

const logger = createModuleLogger('script:check-job-status');

async function main() {
    const jobId = process.argv[2] || '274862'; // Default to the one in the screenshot
    logger.info({ jobId }, '--- Checking Status for Print Job ---');

    const client = createLuluClient();

    try {
        const response: any = await (client as any).request('GET', `/print-jobs/${jobId}/`);

        logger.info({ status: response.status.name }, 'Status');
        logger.info({ created: response.date_created }, 'Created');

        if (response.line_items && response.line_items.length > 0) {
            const item = response.line_items[0];
            logger.info('--- Line Item ---');
            logger.info({ title: item.title }, 'Title');
            logger.info({ status: item.status ? item.status.name : 'Unknown' }, 'Status');
            logger.info({ printableId: item.printable_id }, 'Printable ID');

            if (item.printable_normalization) {
                logger.info({ normalization: item.printable_normalization }, '--- File Issues (Normalization) ---');
            }
        }

    } catch (err) {
        logger.error({ err }, 'Error fetching job');
    }
}

main().catch((err) => logger.error({ err }, 'Unhandled error'));
