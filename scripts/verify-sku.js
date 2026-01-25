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
                country_code: 'US', city: 'New York', state_code: 'NY', postcode: '10001',
                street1: '123 Test St', name: 'John Doe', phone_number: '555-555-5555'
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
                if (res.statusCode !== 201) console.log(body); // Print error if not 201
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
        '0850X0850FCSTDCW080CW444GXX',   // Full Color, Standard, Case Wrap, 80# Coated White
        '0850X0850FCSTDCW060CW444GXX',   // Full Color, Standard, Case Wrap, 60# Coated White
        '0850X0850HCCWSTDPB080CW444GXX', // Hardcover Code again?
    ];

    for (const sku of skus) {
        await checkSku(token, sku);
    }
}

main();
