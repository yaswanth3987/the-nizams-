const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testDelete() {
    try {
        // First, get all items to find a valid ID
        const res = await fetch('http://localhost:3001/api/menu');
        const items = await res.json();
        if (items.length === 0) {
            console.log('No items to delete.');
            return;
        }
        
        const targetId = items[0].id;
        console.log(`Attempting to delete item with ID: ${targetId}`);
        
        const delRes = await fetch(`http://localhost:3001/api/menu/${targetId}`, { method: 'DELETE' });
        const result = await delRes.json();
        console.log('Delete result:', result);
        
        const checkRes = await fetch('http://localhost:3001/api/menu');
        const finalItems = await checkRes.json();
        const found = finalItems.some(i => i.id === targetId);
        console.log(`Item still exists? ${found}`);
    } catch (err) {
        console.error('Test failed:', err);
    }
}

testDelete();
