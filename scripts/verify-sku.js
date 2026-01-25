const https = require('https');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const KEY = process.env.LULU_API_KEY;
const SECRET = process.env.LULU_API_SECRET;

async function getToken() {
    const authString = Buffer.from(`${KEY}:${SECRET}`).toString('base64');
    const params = new URLSearchParams({ grant_type: 'client_credentials' }).toString();

    return new Promise((resolve, reject) => {
        const req = https.request('https://api.sandbox.lulu.com/auth/realms/glasstree/protocol/openid-connect/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${authString}`
            }
        }, res => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => resolve(JSON.parse(body).access_token));
        });
        req.write(params);
        req.end();
    });
}

async function checkSku(token, sku) {
    return new Promise((resolve) => {
        const payload = JSON.stringify({
            line_items: [{ page_count: 32, pod_package_id: sku, quantity: 1 }],
            shipping_address: {
                country_code: 'US', city: 'New York', state_code: 'NY', postal_code: '10001'
            },
            shipping_level: 'MAIL'
        });

        const req = https.request('https://api.sandbox.lulu.com/print-job-cost-calculations/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }, res => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                console.log(`SKU: ${sku} -> Status: ${res.statusCode}`);
                if (res.statusCode !== 200 && res.statusCode !== 201) console.log(body.slice(0, 100));
                resolve();
            });
        });
        req.write(payload);
        req.end();
    });
}

async function main() {
    const token = await getToken();
    const skus = [
        '0850X0850FCPRESS080CW444GXX', // Premium, Saddle Stitch, Coated White
        '0850X0850FCSTDSS080CW444GXX', // Standard, Saddle Stitch
        '0850X0850FCSTDSS060CW444GXX', // Standard 60#
        '0850X0850BWSTDSS060UW444GXX', // B&W baseline
    ];

    for (const sku of skus) {
        await checkSku(token, sku);
    }
}

main();
