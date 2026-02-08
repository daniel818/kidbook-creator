import { fulfillOrder } from '../lib/lulu/fulfillment';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createAdminClient } from '@/lib/supabase/server';
import { createModuleLogger } from '../lib/logger';

const logger = createModuleLogger('script:manual-fulfill');

async function main() {
    logger.info('--- Manual Fulfillment ---');
    const supabase = await createAdminClient();

    // Get latest pending order
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'paid')
        .neq('fulfillment_status', 'SUCCESS')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error || !orders || orders.length === 0) {
        logger.error('No pending orders found to fulfill.');
        return;
    }

    const orderId = '43deb32f-22d7-4ba7-b9c2-8706c8f49193';
    const order = orders[0]; // Keep this line if other properties of 'order' are used later, or for context.
    logger.info({ orderId, originalId: order.id, createdAt: order.created_at }, 'Fulfilling Order');

    try {
        const result = await fulfillOrder(orderId);
        logger.info({ result }, 'Fulfillment result');
    } catch (err) {
        logger.error({ err }, 'Fulfillment Failed');
    }
}

main();
