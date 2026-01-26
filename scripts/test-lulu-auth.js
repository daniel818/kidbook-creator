const https = require('https');
const querystring = require('querystring');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const KEY = process.env.LULU_API_KEY;
const SECRET = process.env.LULU_API_SECRET;
const SANDBOX = process.env.LULU_SANDBOX === 'true';

console.log('--- Lulu Auth Test (Native HTTPS) ---');
console.log('Sandbox:', SANDBOX);
console.log('Key:', KEY ? KEY.slice(0, 5) + '...' : 'MISSING');

function postRequest(urlStr, data, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'POST',
            headers: headers
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body }));
        });

        req.on('error', (e) => reject(e));
        if (data) req.write(data);
        req.end();
    });
}

function getRequest(urlStr, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'GET',
            headers: headers
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body }));
        });

        req.on('error', (e) => reject(e));
        req.end();
    });
}

async function main() {
    // 1. Get Token
    const baseUrl = SANDBOX
        ? 'https://api.sandbox.lulu.com'
        : 'https://api.lulu.com';

    const tokenUrl = `${baseUrl}/auth/realms/glasstree/protocol/openid-connect/token`;
    const authString = Buffer.from(`${KEY}:${SECRET}`).toString('base64');
    const postData = querystring.stringify({ grant_type: 'client_credentials' });

    console.log('1. Fetching Token...');
    try {
        const res = await postRequest(tokenUrl, postData, {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length,
            'Authorization': `Basic ${authString}`
        });

        if (res.statusCode !== 200) {
            console.error('Auth Failed:', res.statusCode);
            console.error(res.body);
            return;
        }

        const token = JSON.parse(res.body).access_token;
        console.log('Auth Success!');

        // 2. Test API Access
        console.log('2. Requesting Print Jobs List...');
        const jobRes = await getRequest(`${baseUrl}/print-jobs/`, {
            'Authorization': `Bearer ${token}`
        });

        console.log('API Status:', jobRes.statusCode);
        console.log('Response Snippet:', jobRes.body.slice(0, 200));

        if (jobRes.statusCode === 200) {
            console.log('✅ Lulu GET API is accessible.');
        }

        // 2.5 Test GET /print-files/
        console.log('2.5 Testing GET /print-files/ ...');
        const filesListRes = await getRequest(`${baseUrl}/print-files/`, {
            'Authorization': `Bearer ${token}`
        });
        console.log('GET Files Status:', filesListRes.statusCode);

        // 2.6 Test GET /files/ (Alternative)
        console.log('2.6 Testing GET /files/ ...');
        const altFilesRes = await getRequest(`${baseUrl}/files/`, {
            'Authorization': `Bearer ${token}`
        });
        console.log('GET /files/ Status:', altFilesRes.statusCode);

        // 3. Test POST /print-files/ VARIATIONS

        const payload = JSON.stringify({ name: 'test_file.pdf' });

        // Variation A: With trailing slash, with Accept header
        console.log('\n3A. Testing POST /print-files/ (with Slash, with Accept)...');
        const resA = await postRequest(`${baseUrl}/print-files/`, payload, {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Content-Length': payload.length
        });
        console.log('Status:', resA.statusCode);
        if (resA.statusCode !== 200 && resA.statusCode !== 201) console.log('Body:', resA.body.slice(0, 300));

        // Variation B: NO trailing slash
        console.log('\n3B. Testing POST /print-files (NO Slash)...');
        const resB = await postRequest(`${baseUrl}/print-files`, payload, {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Content-Length': payload.length
        });
        console.log('Status:', resB.statusCode);

        // Variation C: Upload Url Request? (maybe endpoint changed)
        // Some docs say /upload-urls/ 
        console.log('\n3C. Testing POST /upload-urls/ ...');
        const resC = await postRequest(`${baseUrl}/upload-urls/`, payload, {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Content-Length': payload.length
        });
        console.log('Status:', resC.statusCode);

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
