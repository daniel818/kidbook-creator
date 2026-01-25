
import { createLuluClient } from '../lib/lulu/client';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function registerWebhook() {
    const tunnelUrl = process.env.TUNNEL_URL;
    if (!tunnelUrl) {
        console.error('Error: TUNNEL_URL is not set in environment.');
        process.exit(1);
    }

    const webhookUrl = `${tunnelUrl}/api/webhooks/lulu`;
    console.log(`Target Webhook URL: ${webhookUrl}`);

    const client = createLuluClient();

    try {
        // 1. List existing webhooks
        console.log('Checking existing webhooks...');
        const hooks = await client.listWebhooks();
        console.log(`Found ${hooks.length} existing webhooks.`);

        // 2. Check if already exists
        const existing = hooks.find((h: any) => h.hook_url === webhookUrl);
        if (existing) {
            console.log('✅ Webhook already registered with ID:', existing.id);
            return;
        }

        // 3. Cleanup old tunneling hooks (optional - matching loca.lt but different subdomain)
        // Be careful not to delete production hooks if we were in prod, but this is sandbox.
        for (const hook of hooks) {
            if (hook.hook_url.includes('loca.lt') && hook.hook_url !== webhookUrl) {
                console.log(`Deleting old tunnel webhook: ${hook.hook_url} (${hook.id})`);
                await client.deleteWebhook(hook.id);
            }
        }

        // 4. Create new webhook
        console.log('Registering new webhook...');
        const newHook = await client.createWebhook(webhookUrl);
        console.log('✅ Webhook created successfully!');
        console.log('ID:', newHook.id);
        console.log('Topic:', newHook.hook_topic);
        console.log('URL:', newHook.hook_url);

    } catch (error) {
        console.error('Failed to register webhook:', error);
        process.exit(1);
    }
}

registerWebhook();
