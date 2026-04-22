const { menuData } = require('./backend/menu_seed_data.js');

const LIVE_API_URL = 'https://the-nizams.onrender.com/api/menu';

async function syncLiveMenu() {
    console.log('--- THE GREAT NIZAM: PRODUCTION SYNC ---');
    console.log('Fetching live menu from production...');
    
    let liveItems = [];
    let retryCount = 0;
    const maxRetries = 5;

    while (retryCount < maxRetries) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout
            
            const response = await fetch(LIVE_API_URL, { signal: controller.signal });
            clearTimeout(timeout);
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            liveItems = await response.json();
            console.log(`✅ Connection established. Found ${liveItems.length} items.`);
            break;
        } catch (err) {
            retryCount++;
            console.log(`⚠️ Attempt ${retryCount} failed: ${err.message}. Retrying in 10s...`);
            if (retryCount === maxRetries) {
                console.error('❌ Maximum retries reached. Sync aborted.');
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    }

    let syncedCount = 0;
    for (const localItem of menuData) {
        const liveItem = liveItems.find(i => i.name.trim().toLowerCase() === localItem.name.trim().toLowerCase());
        
        if (liveItem) {
            try {
                const updatedItem = { 
                    ...liveItem, 
                    image: localItem.image || liveItem.image,
                    platterItems: localItem.platterItems || liveItem.platterItems,
                    isRecommended: localItem.isRecommended !== undefined ? localItem.isRecommended : liveItem.isRecommended,
                    isPopular: localItem.isPopular !== undefined ? localItem.isPopular : liveItem.isPopular,
                };
                
                const updateRes = await fetch(`${LIVE_API_URL}/${liveItem.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedItem)
                });
                
                if (updateRes.ok) {
                    console.log(`✅ Synced: ${liveItem.name}`);
                    syncedCount++;
                }
            } catch (e) {
                console.error(`❌ Failed to sync ${localItem.name}: ${e.message}`);
            }
        }
    }
    console.log(`\n🎉 Final Result: ${syncedCount} items updated.`);
}

syncLiveMenu();
