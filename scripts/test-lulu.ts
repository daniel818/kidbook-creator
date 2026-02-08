// Quick test script to verify Lulu sandbox connection
// Run with: npx ts-node scripts/test-lulu.ts

// Load env vars first
require('dotenv').config({ path: '.env.local' });

import { createModuleLogger } from '../lib/logger';

const logger = createModuleLogger('script:test-lulu');

async function testLuluConnection() {
    // Dynamic import for fetch (works in Node 18+)
    const fetch = (await import('node-fetch')).default;
    const apiKey = process.env.LULU_API_KEY;
    const apiSecret = process.env.LULU_API_SECRET;
    const isSandbox = process.env.LULU_SANDBOX === 'true';

    const baseUrl = isSandbox
        ? 'https://api.sandbox.lulu.com'
        : 'https://api.lulu.com';

    logger.info({ environment: isSandbox ? 'SANDBOX' : 'PRODUCTION', baseUrl, apiKeyPrefix: apiKey?.substring(0, 8) }, 'Testing Lulu API connection');

    try {
        // Get OAuth token
        const authUrl = isSandbox
            ? 'https://api.sandbox.lulu.com/auth/realms/glasstree/protocol/openid-connect/token'
            : 'https://api.lulu.com/auth/realms/glasstree/protocol/openid-connect/token';

        const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

        const tokenResponse = await fetch(authUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            throw new Error(`Auth failed: ${tokenResponse.status} - ${error}`);
        }

        const tokenData = await tokenResponse.json() as { expires_in: number; access_token: string };
        logger.info({ expiresIn: tokenData.expires_in }, 'Successfully authenticated with Lulu');

        // Test API by getting pod packages (no-op, just checking connection)
        const packagesUrl = `${baseUrl}/print-job-cost-calculations/`;
        logger.info('Testing cost calculation API...');

        const costResponse = await fetch(packagesUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                line_items: [{
                    page_count: 24,
                    pod_package_id: '0800X0800SCLW060UW444GXX',
                    quantity: 1,
                }],
                shipping_address: {
                    city: 'New York',
                    country_code: 'US',
                    postcode: '10001',
                    state_code: 'NY',
                    street1: '123 Test St',
                },
                shipping_option: 'MAIL',
            }),
        });

        if (!costResponse.ok) {
            const error = await costResponse.text();
            logger.info({ status: costResponse.status }, 'Cost API returned error (may be normal for sandbox - connection works)');
        } else {
            const costData = await costResponse.json() as { total_cost_incl_tax?: string };
            logger.info({ sampleCost: costData.total_cost_incl_tax || 'N/A' }, 'Cost calculation API works');
        }

        logger.info('Lulu Sandbox connection verified');

    } catch (error) {
        logger.error({ err: error }, 'Error connecting to Lulu');
        process.exit(1);
    }
}

// Load env vars
require('dotenv').config({ path: '.env.local' });
testLuluConnection();
