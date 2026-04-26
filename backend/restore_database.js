const { Client } = require('pg');
const { menuData } = require('./menu_seed_data');

const password = process.argv[2];

if (!password) {
    console.error('âŒ Error: Please provide your database password.');
    console.log('Usage: node restore_database.js "nizams@41@Highstreet"');
    process.exit(1);
}

const connectionString = `postgresql://postgres:${encodeURIComponent(password)}@db.bgvbyisoalzbzmsdtrem.supabase.co:5432/postgres`;

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function setup() {
    try {
        console.log('â³ Connecting to Supabase...');
        await client.connect();
        console.log('✅ Connected!');

        console.log('â³ Creating tables...');
        // Create Schemas
        await client.query(`CREATE TABLE IF NOT EXISTS menu_items (id SERIAL PRIMARY KEY, name TEXT NOT NULL, price REAL NOT NULL, category TEXT NOT NULL, image TEXT, description TEXT, "isAvailable" BOOLEAN DEFAULT true, "unavailableUntil" TIMESTAMP, "isPopular" BOOLEAN DEFAULT false, "isRecommended" BOOLEAN DEFAULT false, "isBestSeller" BOOLEAN DEFAULT false, "isNew" BOOLEAN DEFAULT false, "availableFrom" TEXT, "availableTo" TEXT, "platterItems" TEXT);`);
        await client.query(`CREATE TABLE IF NOT EXISTS table_sessions (id SERIAL PRIMARY KEY, "tableId" TEXT NOT NULL, items TEXT NOT NULL, "finalTotal" REAL NOT NULL, "subtotal" REAL DEFAULT 0, "serviceCharge" REAL DEFAULT 0, status TEXT DEFAULT 'active', "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "settled" BOOLEAN DEFAULT false, "paymentDetails" TEXT, "orderType" TEXT DEFAULT 'dine-in', "customerName" TEXT, "phone" TEXT, "sessionId" TEXT, "prepTime" INTEGER, "prepStartedAt" TIMESTAMP);`);
        await client.query(`CREATE TABLE IF NOT EXISTS orders (id SERIAL PRIMARY KEY, "tableId" TEXT NOT NULL, items TEXT NOT NULL, "finalTotal" REAL NOT NULL, "subtotal" REAL DEFAULT 0, "serviceCharge" REAL DEFAULT 0, status TEXT DEFAULT 'new', "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "settled" BOOLEAN DEFAULT false, "paymentDetails" TEXT, "orderType" TEXT DEFAULT 'dine-in', "customerName" TEXT, "phone" TEXT, "sessionId" TEXT, "prepTime" INTEGER, "prepStartedAt" TIMESTAMP);`);
        await client.query(`CREATE TABLE IF NOT EXISTS table_status ("tableId" TEXT PRIMARY KEY, status TEXT NOT NULL, "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
        await client.query(`CREATE TABLE IF NOT EXISTS active_sessions ("tableId" TEXT PRIMARY KEY, "sessionId" TEXT NOT NULL, "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
        await client.query(`CREATE TABLE IF NOT EXISTS qr_sessions (id SERIAL PRIMARY KEY, seating_id TEXT NOT NULL, session_token TEXT NOT NULL, status TEXT DEFAULT 'ACTIVE', start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, end_time TIMESTAMP);`);
        await client.query(`CREATE TABLE IF NOT EXISTS waitlist (id SERIAL PRIMARY KEY, name TEXT NOT NULL, party_size INTEGER NOT NULL, phone TEXT NOT NULL, status TEXT DEFAULT 'waiting', "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
        await client.query(`CREATE TABLE IF NOT EXISTS daily_sales (id SERIAL PRIMARY KEY, date DATE NOT NULL UNIQUE, total_sales REAL NOT NULL, total_orders INTEGER NOT NULL, net_profit REAL DEFAULT 0, cash_collected REAL DEFAULT 0, card_collected REAL DEFAULT 0, upi_collected REAL DEFAULT 0, custom_collected REAL DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
        await client.query(`CREATE TABLE IF NOT EXISTS item_sales (id SERIAL PRIMARY KEY, date DATE NOT NULL, "itemName" TEXT NOT NULL, "quantitySold" INTEGER NOT NULL, "totalRevenue" REAL NOT NULL, "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(date, "itemName"));`);
        await client.query(`CREATE TABLE IF NOT EXISTS assistance_requests (id SERIAL PRIMARY KEY, "tableId" TEXT NOT NULL, type TEXT DEFAULT 'staff', status TEXT DEFAULT 'pending', "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
        await client.query(`CREATE TABLE IF NOT EXISTS employees (id SERIAL PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, "shiftTimings" TEXT, "designation" TEXT, "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
        await client.query(`CREATE TABLE IF NOT EXISTS attendance (id SERIAL PRIMARY KEY, "employeeId" INTEGER NOT NULL, date DATE NOT NULL, "checkInTime" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, verified BOOLEAN DEFAULT false, UNIQUE(date, "employeeId"));`);
        await client.query(`CREATE TABLE IF NOT EXISTS unavailability_schedules (id SERIAL PRIMARY KEY, "itemIds" TEXT, category TEXT, type TEXT NOT NULL, "startDate" DATE, "startTime" TEXT NOT NULL, "endTime" TEXT NOT NULL, "daysOfWeek" TEXT, "isEnabled" BOOLEAN DEFAULT true, label TEXT, "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
        
        console.log('✅ Tables created/verified.');

        console.log(`â³ Seeding menu with ${menuData.length} items...`);
        for (const item of menuData) {
            const check = await client.query('SELECT id FROM menu_items WHERE name = $1 AND category = $2', [item.name, item.category]);
            if (check.rows.length === 0) {
                await client.query(
                    `INSERT INTO menu_items (name, price, category, image, description, "isPopular", "isRecommended", "isBestSeller", "isNew", "platterItems") 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                    [
                        item.name, 
                        item.price, 
                        item.category, 
                        item.image || null, 
                        item.description || null, 
                        item.isPopular || false, 
                        item.isRecommended || false, 
                        item.isBestSeller || false, 
                        item.isNew || false,
                        item.platterItems ? JSON.stringify(item.platterItems) : null
                    ]
                );
            }
        }
        console.log('✅ Menu seeding complete!');
        console.log('\nðŸš€ ALL DONE! Your Supabase database is ready.');
        
    } catch (err) {
        console.error('âŒ Error during setup:', err);
    } finally {
        await client.end();
    }
}

setup();
