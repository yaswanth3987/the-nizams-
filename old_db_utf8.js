const { Pool } = require('pg');
const path = require('path');

const isPg = !!process.env.DATABASE_URL;

let db, pgPool;

if (isPg) {
    pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    console.log('Connected to PostgreSQL cloud database.');
    
    // Create PG tables
    const initPg = async () => {
        try {
            await pgPool.query(`
                CREATE TABLE IF NOT EXISTS orders (
                    id SERIAL PRIMARY KEY,
                    "tableId" TEXT NOT NULL,
                    items TEXT NOT NULL,
                    total REAL NOT NULL,
                    net REAL NOT NULL,
                    vat REAL NOT NULL,
                    status TEXT NOT NULL DEFAULT 'new',
                    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            await pgPool.query(`
                CREATE TABLE IF NOT EXISTS item_sales (
                    id SERIAL PRIMARY KEY,
                    "itemName" TEXT UNIQUE NOT NULL,
                    "quantitySold" INTEGER NOT NULL DEFAULT 0,
                    "totalRevenue" REAL NOT NULL DEFAULT 0
                )
            `);
            await pgPool.query(`
                CREATE TABLE IF NOT EXISTS assistance_requests (
                    id SERIAL PRIMARY KEY,
                    "tableId" TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending',
                    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
        } catch (err) {
            console.error('Error creating PG tables', err);
        }
    };
    initPg();
} else {
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = path.resolve(__dirname, 'nizam.db');
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening local SQLite database', err.message);
        } else {
            console.log('Connected to the local SQLite database.');
            db.run(`CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tableId TEXT NOT NULL,
                items TEXT NOT NULL,
                total REAL NOT NULL,
                net REAL NOT NULL,
                vat REAL NOT NULL,
                status TEXT NOT NULL DEFAULT 'new',
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);
            db.run(`CREATE TABLE IF NOT EXISTS item_sales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                itemName TEXT UNIQUE NOT NULL,
                quantitySold INTEGER NOT NULL DEFAULT 0,
                totalRevenue REAL NOT NULL DEFAULT 0
            )`);
            db.run(`CREATE TABLE IF NOT EXISTS assistance_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tableId TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);
        }
    });
}

// Universal Query Runner
const runQuery = async (sql, params = []) => {
    if (isPg) {
        let text = sql;
        let i = 1;
        // Auto-convert ? to $1 $2 for Postgres
        if (text.includes('?')) {
            text = text.replace(/\?/g, () => `$${i++}`);
        }
        return await pgPool.query(text, params);
    } else {
        return new Promise((resolve, reject) => {
            if (sql.trim().toUpperCase().startsWith('SELECT')) {
                db.all(sql, params, (err, rows) => {
                    if (err) reject(err); else resolve({ rows });
                });
            } else {
                db.run(sql, params, function(err) {
                    if (err) reject(err); else resolve({ lastID: this.lastID, changes: this.changes });
                });
            }
        });
    }
};

// Database APIs
const getOrdersByStatus = async (statuses) => {
    const placeholders = statuses.map(() => '?').join(',');
    const sql = `SELECT * FROM orders WHERE status IN (${placeholders}) ORDER BY "createdAt" DESC`;
    const res = await runQuery(sql, statuses);
    return res.rows.map(row => ({ ...row, items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items }));
};

const createOrder = async (orderData) => {
    const { tableId, items, total, net, vat, status } = orderData;
    const itemsJson = JSON.stringify(items);
    
    if (isPg) {
        const sql = `INSERT INTO orders ("tableId", items, total, net, vat, status) VALUES (?, ?, ?, ?, ?, ?) RETURNING *`;
        const res = await runQuery(sql, [tableId, itemsJson, total, net, vat, status || 'new']);
        const row = res.rows[0];
        return { ...row, items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items };
    } else {
        const sql = `INSERT INTO orders (tableId, items, total, net, vat, status) VALUES (?, ?, ?, ?, ?, ?)`;
        const res = await runQuery(sql, [tableId, itemsJson, total, net, vat, status || 'new']);
        const selectRes = await runQuery(`SELECT * FROM orders WHERE id = ?`, [res.lastID]);
        const row = selectRes.rows[0];
        return { ...row, items: JSON.parse(row.items) };
    }
};

const updateOrderStatus = async (id, status) => {
    const oldOrderRes = await runQuery(`SELECT * FROM orders WHERE id = ?`, [id]);
    const oldOrder = oldOrderRes.rows[0];
    if (!oldOrder) throw new Error('Order not found');

    await runQuery(`UPDATE orders SET status = ? WHERE id = ?`, [status, id]);

    if ((status === 'completed' || status === 'billed' || status === 'archived') && 
        (oldOrder.status !== 'completed' && oldOrder.status !== 'billed' && oldOrder.status !== 'archived')) {
        
        const items = typeof oldOrder.items === 'string' ? JSON.parse(oldOrder.items) : oldOrder.items;
        
        for (const item of items) {
            if (isPg) {
                await runQuery(
                    `INSERT INTO item_sales ("itemName", "quantitySold", "totalRevenue") 
                     VALUES (?, ?, ?) 
                     ON CONFLICT("itemName") DO UPDATE SET 
                     "quantitySold" = item_sales."quantitySold" + EXCLUDED."quantitySold",
                     "totalRevenue" = item_sales."totalRevenue" + EXCLUDED."totalRevenue"`,
                    [item.name, item.qty, item.price * item.qty]
                ).catch(err => console.error('PG Upsert error', err));
            } else {
                await runQuery(
                    `INSERT INTO item_sales (itemName, quantitySold, totalRevenue) 
                     VALUES (?, ?, ?) 
                     ON CONFLICT(itemName) DO UPDATE SET 
                     quantitySold = quantitySold + excluded.quantitySold,
                     totalRevenue = totalRevenue + excluded.totalRevenue`,
                    [item.name, item.qty, item.price * item.qty]
                ).catch(err => console.error('SQLite Upsert error', err));
            }
        }
    }

    const newOrderRes = await runQuery(`SELECT * FROM orders WHERE id = ?`, [id]);
    const row = newOrderRes.rows[0];
    return { ...row, items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items };
};

const deleteOrder = async (id) => {
    await runQuery(`DELETE FROM orders WHERE id = ?`, [id]);
    return { id };
};

const clearTableOrders = async (tableId) => {
    const res = await runQuery(`UPDATE orders SET status = 'archived' WHERE "tableId" = ? AND status IN ('completed', 'billed')`, [tableId]);
    return { tableId, changes: isPg ? res.rowCount : res.changes };
};

const getAnalyticsDaily = async (dateStr) => {
    const dateParam = dateStr ? `${dateStr}%` : `${new Date().toISOString().split('T')[0]}%`;
    
    // Postgres requires casting TIMESTAMP to texts for LIKE.
    const sql = isPg 
        ? `SELECT COUNT(*) as "totalOrders", SUM(total) as "grossRevenue", SUM(net) as "netRevenue", SUM(vat) as "totalVat" FROM orders WHERE status IN ('completed', 'billed', 'archived') AND "createdAt"::text LIKE ?`
        : `SELECT COUNT(*) as totalOrders, SUM(total) as grossRevenue, SUM(net) as netRevenue, SUM(vat) as totalVat FROM orders WHERE status IN ('completed', 'billed', 'archived') AND createdAt LIKE ?`;
    
    const res = await runQuery(sql, [dateParam]);
    return res.rows[0];
};

const getItemAnalytics = async () => {
    const res = await runQuery(`SELECT * FROM item_sales ORDER BY "quantitySold" DESC`);
    return res.rows;
};

const getAssistanceRequests = async () => {
    const res = await runQuery(`SELECT * FROM assistance_requests ORDER BY "createdAt" DESC`);
    return res.rows;
};

const createAssistanceRequest = async (tableId) => {
    if (isPg) {
        const res = await runQuery(`INSERT INTO assistance_requests ("tableId", status) VALUES (?, ?) RETURNING *`, [tableId, 'pending']);
        return res.rows[0];
    } else {
        const res = await runQuery(`INSERT INTO assistance_requests (tableId, status) VALUES (?, ?)`, [tableId, 'pending']);
        const selectRes = await runQuery(`SELECT * FROM assistance_requests WHERE id = ?`, [res.lastID]);
        return selectRes.rows[0];
    }
};

const updateAssistanceStatus = async (id, status) => {
    await runQuery(`UPDATE assistance_requests SET status = ? WHERE id = ?`, [status, id]);
    const res = await runQuery(`SELECT * FROM assistance_requests WHERE id = ?`, [id]);
    return res.rows[0];
};

const deleteAssistanceRequest = async (id) => {
    await runQuery(`DELETE FROM assistance_requests WHERE id = ?`, [id]);
    return { id };
};

module.exports = {
    db,
    pgPool,
    isPg,
    getOrdersByStatus,
    createOrder,
    updateOrderStatus,
    deleteOrder,
    clearTableOrders,
    getAnalyticsDaily,
    getItemAnalytics,
    getAssistanceRequests,
    createAssistanceRequest,
    updateAssistanceStatus,
    deleteAssistanceRequest
};
