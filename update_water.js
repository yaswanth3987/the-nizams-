const { Client } = require('pg');

async function updateWater() {
    const client = new Client({
        connectionString: 'postgresql://postgres.clpcykgnjthnlyhgtmwt:MyPassword123_23028@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?sslmode=require'
    });

    try {
        await client.connect();
        console.log('Connected to Supabase');
        
        const res = await client.query("UPDATE menu SET price = 1.50 WHERE name = 'WATER BOTTLE'");
        console.log('Rows updated:', res.rowCount);
        
        const check = await client.query("SELECT * FROM menu WHERE name = 'WATER BOTTLE'");
        console.log('Current status:', check.rows);
    } catch (err) {
        console.error('Update failed:', err);
    } finally {
        await client.end();
    }
}

updateWater();
