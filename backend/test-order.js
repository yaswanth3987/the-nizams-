const http = require('http');

const data = JSON.stringify({
    tableId: 'T05',
    items: [{ id: 'm1', name: 'Test', price: 10, qty: 1 }],
    total: 10,
    net: 8,
    vat: 2,
    status: 'new'
});

const req = http.request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/orders',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
}, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`BODY: ${body}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
