const https = require('https');
const { menuData } = require('./backend/menu_seed_data.js');

const LIVE_API_URL = 'https://the-nizams.onrender.com/api/menu';

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

function putJson(url, data) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const reqStr = JSON.stringify(data);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(reqStr)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(body));
        });

        req.on('error', reject);
        req.write(reqStr);
        req.end();
    });
}

async function syncLiveMenu() {
    console.log('Fetching live menu from production...');
    
    try {
        const liveItems = await fetchJson(LIVE_API_URL);
        let syncedCount = 0;
        
        for (const localItem of menuData) {
            if (localItem.image) {
                // Find matching live item by name
                const liveItem = liveItems.find(i => 
                    i.name.toLowerCase() === localItem.name.toLowerCase() && 
                    i.category.toLowerCase() === localItem.category.toLowerCase()
                );
                
                if (liveItem) {
                    const updatedItem = { ...liveItem, image: localItem.image };
                    await putJson(`${LIVE_API_URL}/${liveItem.id}`, updatedItem);
                    console.log(`✅ Success: ${liveItem.name} -> ${localItem.image}`);
                    syncedCount++;
                }
            }
        }
        
        console.log(`\n🎉 Sync complete! Updated ${syncedCount} items with images.`);
    } catch (err) {
        console.error('Error syncing menu:', err);
    }
}

syncLiveMenu();
