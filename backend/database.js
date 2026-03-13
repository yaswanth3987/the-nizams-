const { Pool } = require('pg');

console.log("Using PostgreSQL Database");
const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pgPool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Create tables
const createTablesQuery = `
    CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        category TEXT NOT NULL,
        image TEXT,
        description TEXT
    );

    CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        low_stock_threshold REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        items TEXT NOT NULL,
        total REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS waitlist (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        party_size INTEGER NOT NULL,
        phone TEXT NOT NULL,
        status TEXT DEFAULT 'waiting',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS daily_sales (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        total_sales REAL NOT NULL,
        total_orders INTEGER NOT NULL,
        net_profit REAL DEFAULT 0,
        cash_collected REAL DEFAULT 0,
        card_collected REAL DEFAULT 0,
        upi_collected REAL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS item_sales (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        item_name TEXT NOT NULL,
        quantity_sold INTEGER NOT NULL,
        total_revenue REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, item_name)
    );

    CREATE TABLE IF NOT EXISTS assistance_requests (
        id SERIAL PRIMARY KEY,
        tableId TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`;

pgPool.query(createTablesQuery, (err, res) => {
    if (err) {
        console.error('Error creating PG tables', err.stack);
    } else {
        console.log('PG Tables created or exist');
    }
});


// Universal query wrapper
const runQuery = (query, params = []) => {
    return new Promise((resolve, reject) => {
        let pgQuery = query;
        let pgParams = params;

        // Auto-convert SQLite ? placeholders to PG $1, $2
        if (pgQuery.includes('?')) {
            let paramIndex = 1;
            pgQuery = pgQuery.replace(/\?/g, () => `$${paramIndex++}`);
        }

        pgPool.query(pgQuery, pgParams, (err, res) => {
            if (err) {
                console.error("PG Query Error:", err);
                reject(err);
                return;
            }
            const stmtType = pgQuery.trim().toUpperCase().split(' ')[0];
            
            if (stmtType === 'SELECT' || pgQuery.trim().toUpperCase().startsWith('WITH')) {
                resolve(res.rows);
            } else if (stmtType === 'INSERT') {
                if (res.rows && res.rows.length > 0) {
                    resolve({ lastID: res.rows[0].id });
                } else {
                    resolve({ lastID: null, changes: res.rowCount });
                }
            } else { // UPDATE, DELETE
                resolve({ changes: res.rowCount });
            }
        });
    });
};

module.exports = { runQuery, db: null };
