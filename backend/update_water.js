const { Client } = require('pg');

async function updateWater() {
    const client = new Client({
        user: 'postgres',
        host: 'db.clpcykgnjthnlyhgtmwt.supabase.co',
        database: 'postgres',
        password: 'MyPassword123_23028',
        port: 5432,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('Connected to Supabase (Direct)');
        
        const res = await client.query("UPDATE menu_items SET price = 1.50 WHERE name = 'WATER BOTTLE'");
        console.log('Rows updated in menu_items:', res.rowCount);
        
        const check = await client.query("SELECT * FROM menu_items WHERE name = 'WATER BOTTLE'");
        console.log('Current status:', check.rows);
    } catch (err) {
        console.error('Update failed:', err);
    } finally {
        await client.end();
    }
}

updateWater();
