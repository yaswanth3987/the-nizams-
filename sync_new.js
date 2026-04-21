const { menuData } = require('./backend/menu_seed_data.js');

const LIVE_API_URL = 'https://the-nizams.onrender.com/api/menu';

async function syncLiveMenu() {
    console.log('Fetching live menu from production...');
    
    try {
        const response = await fetch(LIVE_API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const liveItems = await response.json();
        
        let syncedCount = 0;
        
        for (const localItem of menuData) {
            if (localItem.image) {
                // Find matching live item by name
                const liveItem = liveItems.find(i => 
                    i.name.toLowerCase() === localItem.name.toLowerCase() && 
                    i.category.toLowerCase() === localItem.category.toLowerCase()
                );
                
                if (liveItem) {
                    console.log(`Syncing image for: ${liveItem.name}...`);
                    const updatedItem = { ...liveItem, image: localItem.image };
                    
                    const updateRes = await fetch(`${LIVE_API_URL}/${liveItem.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedItem)
                    });
                    
                    if (updateRes.ok) {
                        console.log(`✅ Success: ${liveItem.name} -> ${localItem.image}`);
                        syncedCount++;
                    } else {
                        console.error(`❌ Failed to update ${liveItem.name}`);
                    }
                }
            }
        }
        
        console.log(`\n🎉 Sync complete! Updated ${syncedCount} items with images.`);
    } catch (err) {
        console.error('Error syncing menu:', err);
    }
}

syncLiveMenu();
