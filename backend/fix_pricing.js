const { runQuery, seedMenu, isPg } = require('./database');
const { menuData } = require('./menu_seed_data');

async function fixPricing() {
    console.log('--- STARTING PRICING FIX MIGRATION ---');

    try {
        // 1. Clear legacy transaction data
        console.log('Step 1: Clearing legacy transaction data...');
        await runQuery('DELETE FROM orders');
        await runQuery('DELETE FROM table_sessions');
        await runQuery('DELETE FROM item_sales');
        await runQuery('DELETE FROM daily_sales');
        await runQuery('DELETE FROM active_sessions');
        await runQuery('DELETE FROM qr_sessions');
        await runQuery('DELETE FROM assistance_requests');
        console.log('âœ… All transaction tables cleared.');

        // 2. Reset table statuses to available
        console.log('Step 2: Resetting table statuses...');
        await runQuery('DELETE FROM table_status');
        console.log('âœ… Table statuses reset.');

        // 3. Force re-seed of menu with new prices
        console.log('Step 3: Synchronizing menu with new GBP prices...');
        await seedMenu(menuData);
        console.log('âœ… Menu synchronization complete.');

        console.log('--- PRICING FIX MIGRATION SUCCESSFUL ---');
        process.exit(0);
    } catch (err) {
        console.error('âŒ MIGRATION FAILED:', err);
        process.exit(1);
    }
}

fixPricing();
