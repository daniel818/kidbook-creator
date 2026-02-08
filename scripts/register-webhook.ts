
import { createLuluClient } from '../lib/lulu/client';
import dotenv from 'dotenv';
import path from 'path';
import { createModuleLogger } from '../lib/logger';

const logger = createModuleLogger('script:register-webhook');

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function registerWebhook() {
    const tunnelUrl = process.env.TUNNEL_URL;
    if (!tunnelUrl) {
        logger.error('TUNNEL_URL is not set in environment.');
        process.exit(1);
    }

    const webhookUrl = `${tunnelUrl}/api/webhooks/lulu`;
    logger.info({ webhookUrl }, 'Target Webhook URL');

    const client = createLuluClient();

    try {
        // 1. List existing webhooks
        logger.info('Checking existing webhooks...');
        const hooks = await client.listWebhooks();
        logger.info({ count: hooks.length }, 'Found existing webhooks');

        // 2. Check if already exists
        const existing = hooks.find((h: any) => h.hook_url === webhookUrl);
        if (existing) {
            logger.info({ id: existing.id }, 'Webhook already registered');
            return;
        }

        // 3. Cleanup old tunneling hooks (optional - matching loca.lt but different subdomain)
        // Be careful not to delete production hooks if we were in prod, but this is sandbox.
        for (const hook of hooks) {
            if (hook.hook_url.includes('loca.lt') && hook.hook_url !== webhookUrl) {
                logger.info({ hookUrl: hook.hook_url, id: hook.id }, 'Deleting old tunnel webhook');
                await client.deleteWebhook(hook.id);
            }
        }

        // 4. Create new webhook
        logger.info('Registering new webhook...');
        const newHook = await client.createWebhook(webhookUrl);
        logger.info({ id: newHook.id, topic: newHook.hook_topic, url: newHook.hook_url }, 'Webhook created successfully');

    } catch (error) {
        logger.error({ err: error }, 'Failed to register webhook');
        process.exit(1);
    }
}

registerWebhook();
