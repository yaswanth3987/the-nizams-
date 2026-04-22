const { Pool } = require('pg');
const path = require('path');
const isPg = !!process.env.DATABASE_URL;
let db, pgPool;

if (isPg) {
    pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 30 // Support up to 50-60 concurrent users (assuming short-lived requests)
    });
    console.log('Connected to PostgreSQL cloud database.');
    
    // Create new schemas
    const initPg = async () => {
        try {
            await pgPool.query(`CREATE TABLE IF NOT EXISTS menu_items (id SERIAL PRIMARY KEY, name TEXT NOT NULL, price REAL NOT NULL, category TEXT NOT NULL, image TEXT, description TEXT, "isAvailable" BOOLEAN DEFAULT true, "unavailableUntil" TIMESTAMP, "isPopular" BOOLEAN DEFAULT false, "isRecommended" BOOLEAN DEFAULT false, "isBestSeller" BOOLEAN DEFAULT false, "isNew" BOOLEAN DEFAULT false, "availableFrom" TEXT, "availableTo" TEXT, "platterItems" TEXT);`);
            await pgPool.query(`CREATE TABLE IF NOT EXISTS table_sessions (id SERIAL PRIMARY KEY, "tableId" TEXT NOT NULL, items TEXT NOT NULL, "finalTotal" REAL NOT NULL, "subtotal" REAL DEFAULT 0, "serviceCharge" REAL DEFAULT 0, status TEXT DEFAULT 'active', "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
            await pgPool.query(`ALTER TABLE table_sessions RENAME COLUMN net TO subtotal;`).catch(() => {});
            await pgPool.query(`ALTER TABLE table_sessions RENAME COLUMN vat TO serviceCharge;`).catch(() => {});
            await pgPool.query(`ALTER TABLE table_sessions RENAME COLUMN total TO "finalTotal";`).catch(() => {});
            await pgPool.query(`ALTER TABLE table_sessions ADD COLUMN IF NOT EXISTS "orderType" TEXT DEFAULT 'dine-in';`).catch(() => {});
            await pgPool.query(`ALTER TABLE table_sessions ADD COLUMN IF NOT EXISTS "customerName" TEXT;`).catch(() => {});
            await pgPool.query(`ALTER TABLE table_sessions ADD COLUMN IF NOT EXISTS "phone" TEXT;`).catch(() => {});
            await pgPool.query(`ALTER TABLE table_sessions ADD COLUMN IF NOT EXISTS "sessionId" TEXT;`).catch(() => {});
            await pgPool.query(`ALTER TABLE table_sessions ADD COLUMN IF NOT EXISTS "prepTime" INTEGER;`).catch(() => {});
            await pgPool.query(`ALTER TABLE table_sessions ADD COLUMN IF NOT EXISTS "prepStartedAt" TIMESTAMP;`).catch(() => {});
            
            await pgPool.query(`CREATE TABLE IF NOT EXISTS orders (id SERIAL PRIMARY KEY, "tableId" TEXT NOT NULL, items TEXT NOT NULL, "finalTotal" REAL NOT NULL, "subtotal" REAL DEFAULT 0, "serviceCharge" REAL DEFAULT 0, status TEXT DEFAULT 'new', "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
            await pgPool.query(`ALTER TABLE orders RENAME COLUMN net TO subtotal;`).catch(() => {});
            await pgPool.query(`ALTER TABLE orders RENAME COLUMN vat TO serviceCharge;`).catch(() => {});
            await pgPool.query(`ALTER TABLE orders RENAME COLUMN total TO "finalTotal";`).catch(() => {});
            await pgPool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS "orderType" TEXT DEFAULT 'dine-in';`).catch(() => {});
            await pgPool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS "customerName" TEXT;`).catch(() => {});
            await pgPool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS "phone" TEXT;`).catch(() => {});
            await pgPool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS "sessionId" TEXT;`).catch(() => {});
            await pgPool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS "prepTime" INTEGER;`).catch(() => {});
            await pgPool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS "prepStartedAt" TIMESTAMP;`).catch(() => {});
            await pgPool.query(`CREATE TABLE IF NOT EXISTS table_status ("tableId" TEXT PRIMARY KEY, status TEXT NOT NULL, "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
            await pgPool.query(`CREATE TABLE IF NOT EXISTS active_sessions ("tableId" TEXT PRIMARY KEY, "sessionId" TEXT NOT NULL, "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
            await pgPool.query(`CREATE TABLE IF NOT EXISTS qr_sessions (id SERIAL PRIMARY KEY, seating_id TEXT NOT NULL, session_token TEXT NOT NULL, status TEXT DEFAULT 'ACTIVE', start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, end_time TIMESTAMP);`);
            await pgPool.query(`CREATE TABLE IF NOT EXISTS waitlist (id SERIAL PRIMARY KEY, name TEXT NOT NULL, party_size INTEGER NOT NULL, phone TEXT NOT NULL, status TEXT DEFAULT 'waiting', "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
            await pgPool.query(`CREATE TABLE IF NOT EXISTS daily_sales (id SERIAL PRIMARY KEY, date DATE NOT NULL UNIQUE, total_sales REAL NOT NULL, total_orders INTEGER NOT NULL, net_profit REAL DEFAULT 0, cash_collected REAL DEFAULT 0, card_collected REAL DEFAULT 0, upi_collected REAL DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
            await pgPool.query(`CREATE TABLE IF NOT EXISTS item_sales (id SERIAL PRIMARY KEY, date DATE NOT NULL, "itemName" TEXT NOT NULL, "quantitySold" INTEGER NOT NULL, "totalRevenue" REAL NOT NULL, "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(date, "itemName"));`);
            await pgPool.query(`CREATE TABLE IF NOT EXISTS assistance_requests (id SERIAL PRIMARY KEY, "tableId" TEXT NOT NULL, type TEXT DEFAULT 'staff', status TEXT DEFAULT 'pending', "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
            await pgPool.query(`ALTER TABLE assistance_requests ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'staff';`).catch(() => {});
            await pgPool.query(`CREATE TABLE IF NOT EXISTS employees (id SERIAL PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, "faceEmbedding" TEXT, "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
            await pgPool.query(`CREATE TABLE IF NOT EXISTS attendance (id SERIAL PRIMARY KEY, "employeeId" INTEGER NOT NULL, date DATE NOT NULL, "checkInTime" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, verified BOOLEAN DEFAULT false, UNIQUE(date, "employeeId"));`);
            await pgPool.query(`CREATE TABLE IF NOT EXISTS unavailability_schedules (id SERIAL PRIMARY KEY, "itemIds" TEXT, category TEXT, type TEXT NOT NULL, "startDate" DATE, "startTime" TEXT NOT NULL, "endTime" TEXT NOT NULL, "daysOfWeek" TEXT, "isEnabled" BOOLEAN DEFAULT true, label TEXT, "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
            await pgPool.query(`ALTER TABLE employees ADD COLUMN "faceEmbedding" TEXT;`).catch(() => {});
            // Add badge columns to menu_items if they don't exist
            await pgPool.query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS "isPopular" BOOLEAN DEFAULT false;`).catch(() => {});
            await pgPool.query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS "isRecommended" BOOLEAN DEFAULT false;`).catch(() => {});
            await pgPool.query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS "isBestSeller" BOOLEAN DEFAULT false;`).catch(() => {});
            await pgPool.query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS "isNew" BOOLEAN DEFAULT false;`).catch(() => {});
            await pgPool.query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS "availableFrom" TEXT;`).catch(() => {});
            await pgPool.query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS "availableTo" TEXT;`).catch(() => {});
            await pgPool.query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS "platterItems" TEXT;`).catch(() => {});
        } catch (err) { console.error('Error creating PG tables', err); }
    };
    initPg();
} else {
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = path.resolve(__dirname, 'nizam.db');
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) console.error('Error opening local SQLite database', err.message);
        else {
            console.log('Connected to the local SQLite database.');
            db.run('PRAGMA journal_mode=WAL'); // Enable WAL mode for better concurrency support (multiple readers, one writer)
            db.run(`CREATE TABLE IF NOT EXISTS menu_items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, price REAL NOT NULL, category TEXT NOT NULL, image TEXT, description TEXT, isAvailable BOOLEAN DEFAULT 1, unavailableUntil DATETIME, isPopular BOOLEAN DEFAULT 0, isRecommended BOOLEAN DEFAULT 0, isBestSeller BOOLEAN DEFAULT 0, isNew BOOLEAN DEFAULT 0, availableFrom TEXT, availableTo TEXT, platterItems TEXT)`);
            db.run(`CREATE TABLE IF NOT EXISTS table_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, tableId TEXT NOT NULL, items TEXT NOT NULL, finalTotal REAL NOT NULL, subtotal REAL DEFAULT 0, serviceCharge REAL DEFAULT 0, status TEXT DEFAULT 'active', createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)`);
            db.run(`ALTER TABLE table_sessions RENAME COLUMN net TO subtotal`, (err) => {});
            db.run(`ALTER TABLE table_sessions RENAME COLUMN vat TO serviceCharge`, (err) => {});
            db.run(`ALTER TABLE table_sessions RENAME COLUMN total TO finalTotal`, (err) => {});
            db.run(`ALTER TABLE table_sessions ADD COLUMN orderType TEXT DEFAULT 'dine-in'`, (err) => {});
            db.run(`ALTER TABLE table_sessions ADD COLUMN customerName TEXT`, (err) => {});
            db.run(`ALTER TABLE table_sessions ADD COLUMN phone TEXT`, (err) => {});
            db.run(`ALTER TABLE table_sessions ADD COLUMN sessionId TEXT`, (err) => {});
            db.run(`ALTER TABLE table_sessions ADD COLUMN prepTime INTEGER`, (err) => {});
            db.run(`ALTER TABLE table_sessions ADD COLUMN prepStartedAt DATETIME`, (err) => {});

            db.run(`CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, tableId TEXT NOT NULL, items TEXT NOT NULL, finalTotal REAL NOT NULL, subtotal REAL DEFAULT 0, serviceCharge REAL DEFAULT 0, status TEXT DEFAULT 'new', createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)`);
            db.run(`ALTER TABLE orders RENAME COLUMN net TO subtotal`, (err) => {});
            db.run(`ALTER TABLE orders RENAME COLUMN vat TO serviceCharge`, (err) => {});
            db.run(`ALTER TABLE orders RENAME COLUMN total TO finalTotal`, (err) => {});
            db.run(`ALTER TABLE orders ADD COLUMN orderType TEXT DEFAULT 'dine-in'`, (err) => {});
            db.run(`ALTER TABLE orders ADD COLUMN customerName TEXT`, (err) => {});
            db.run(`ALTER TABLE orders ADD COLUMN phone TEXT`, (err) => {});
            db.run(`ALTER TABLE orders ADD COLUMN sessionId TEXT`, (err) => {});
            db.run(`ALTER TABLE orders ADD COLUMN prepTime INTEGER`, (err) => {});
            db.run(`ALTER TABLE orders ADD COLUMN prepStartedAt DATETIME`, (err) => {});
            
            db.run(`CREATE TABLE IF NOT EXISTS table_status (tableId TEXT PRIMARY KEY, status TEXT NOT NULL, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP)`);
            db.run(`CREATE TABLE IF NOT EXISTS active_sessions (tableId TEXT PRIMARY KEY, sessionId TEXT NOT NULL, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)`);
            db.run(`CREATE TABLE IF NOT EXISTS qr_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, seating_id TEXT NOT NULL, session_token TEXT NOT NULL, status TEXT DEFAULT 'ACTIVE', start_time DATETIME DEFAULT CURRENT_TIMESTAMP, end_time DATETIME)`);
            db.run(`CREATE TABLE IF NOT EXISTS waitlist (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, party_size INTEGER NOT NULL, phone TEXT NOT NULL, status TEXT DEFAULT 'waiting', createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)`);
            db.run(`CREATE TABLE IF NOT EXISTS daily_sales (id INTEGER PRIMARY KEY AUTOINCREMENT, date DATE NOT NULL UNIQUE, total_sales REAL NOT NULL, total_orders INTEGER NOT NULL, net_profit REAL DEFAULT 0, cash_collected REAL DEFAULT 0, card_collected REAL DEFAULT 0, upi_collected REAL DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
            db.run(`CREATE TABLE IF NOT EXISTS item_sales (id INTEGER PRIMARY KEY AUTOINCREMENT, date DATE NOT NULL, itemName TEXT NOT NULL, quantitySold INTEGER NOT NULL, totalRevenue REAL NOT NULL, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(date, itemName))`);
            db.run(`CREATE TABLE IF NOT EXISTS assistance_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, tableId TEXT NOT NULL, type TEXT DEFAULT 'staff', status TEXT DEFAULT 'pending', createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)`);
            db.run(`ALTER TABLE assistance_requests ADD COLUMN type TEXT DEFAULT 'staff'`, (err) => {});
            db.run(`ALTER TABLE menu_items ADD COLUMN platterItems TEXT`, (err) => {});
            db.run(`CREATE TABLE IF NOT EXISTS employees (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT NOT NULL, faceEmbedding TEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)`);
            db.run(`CREATE TABLE IF NOT EXISTS attendance (id INTEGER PRIMARY KEY AUTOINCREMENT, employeeId INTEGER NOT NULL, date DATE NOT NULL, checkInTime DATETIME DEFAULT CURRENT_TIMESTAMP, verified BOOLEAN DEFAULT 0, UNIQUE(date, employeeId))`);
            db.run(`CREATE TABLE IF NOT EXISTS unavailability_schedules (id INTEGER PRIMARY KEY AUTOINCREMENT, itemIds TEXT, category TEXT, type TEXT NOT NULL, startDate DATE, startTime TEXT NOT NULL, endTime TEXT NOT NULL, daysOfWeek TEXT, isEnabled BOOLEAN DEFAULT 1, label TEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)`);
            db.run(`ALTER TABLE employees ADD COLUMN faceEmbedding TEXT`, (err) => {});
            // Add badge columns to menu_items if they don't exist
            db.run(`ALTER TABLE menu_items ADD COLUMN isPopular BOOLEAN DEFAULT 0`, (err) => {});
            db.run(`ALTER TABLE menu_items ADD COLUMN isRecommended BOOLEAN DEFAULT 0`, (err) => {});
            db.run(`ALTER TABLE menu_items ADD COLUMN isBestSeller BOOLEAN DEFAULT 0`, (err) => {});
            db.run(`ALTER TABLE menu_items ADD COLUMN isNew BOOLEAN DEFAULT 0`, (err) => {});
            db.run(`ALTER TABLE menu_items ADD COLUMN availableFrom TEXT`, (err) => {});
            db.run(`ALTER TABLE menu_items ADD COLUMN availableTo TEXT`, (err) => {});
        }
    });
}

// Universal Query Runner
const runQuery = async (sql, params = []) => {
    try {
        if (isPg) {
            let text = sql;
            let i = 1;
            if (text.includes('?')) {
                text = text.replace(/\?/g, () => `$${i++}`);
            }
            return await pgPool.query(text, params);
        } else {
            return new Promise((resolve, reject) => {
                const upperSql = sql.trim().toUpperCase();
                if (upperSql.startsWith('SELECT') || upperSql.startsWith('PRAGMA')) {
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
    } catch (err) {
        console.error(`❌ DATABASE ERROR [${isPg ? 'PostgreSQL' : 'SQLite'}]:`, err.message);
        console.error(`   Query: ${sql}`);
        console.error(`   Params:`, JSON.stringify(params));
        throw err;
    }
};

const getOrdersByStatus = async (statuses) => {
    const placeholders = statuses.map(() => '?').join(',');
    const sql = isPg ? `SELECT * FROM orders WHERE status IN (${placeholders}) ORDER BY "createdAt" DESC` : `SELECT * FROM orders WHERE status IN (${placeholders}) ORDER BY createdAt DESC`;
    const res = await runQuery(sql, statuses);
    return res.rows.map(row => ({ ...row, items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items }));
};

const addOrderToSession = async (orderData) => {
    const { tableId, items, orderType, customerName, phone, sessionId } = orderData;
    const itemsJson = JSON.stringify(items);
    const ot = orderType || 'dine-in';
    const cName = customerName || null;
    const pNum = phone || null;
    const sId = sessionId || null;
    
    // Secure backend calculations
    const calcSubtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const calcServiceCharge = (ot === 'takeaway' || tableId === 'TAKEAWAY') ? 0 : calcSubtotal * 0.10;
    const calcFinalTotal = calcSubtotal + calcServiceCharge;
    
    // Always create a new session (shard) for each incoming order round 
    // This satisfies the requirement to "show the difference" in the admin dashboard
    if (isPg) {
        const sql = `INSERT INTO table_sessions ("tableId", items, "finalTotal", subtotal, "serviceCharge", status, "orderType", "customerName", "phone", "sessionId") VALUES (?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?) RETURNING *`;
        const res = await runQuery(sql, [tableId.toString(), itemsJson, calcFinalTotal, calcSubtotal, calcServiceCharge, ot, cName, pNum, sId]);
        const row = res.rows[0];
        return { ...row, items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items };
    } else {
        const sql = `INSERT INTO table_sessions (tableId, items, finalTotal, subtotal, serviceCharge, status, orderType, customerName, phone, sessionId) VALUES (?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?)`;
        const res = await runQuery(sql, [tableId.toString(), itemsJson, calcFinalTotal, calcSubtotal, calcServiceCharge, ot, cName, pNum, sId]);
        const selectRes = await runQuery(`SELECT * FROM table_sessions WHERE id = ?`, [res.lastID]);
        const row = selectRes.rows[0];
        return { ...row, items: JSON.parse(row.items) };
    }
};

const createOrder = async (orderData) => {
    const { tableId, items, orderType, customerName, phone, sessionId } = orderData;
    const itemsJson = JSON.stringify(items);
    const ot = orderType || 'dine-in';
    const cName = customerName || null;
    const pNum = phone || null;
    const sId = sessionId || null;
    
    // Secure backend calculations
    const calcSubtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const calcServiceCharge = (ot === 'takeaway' || tableId === 'TAKEAWAY') ? 0 : calcSubtotal * 0.10;
    const calcFinalTotal = calcSubtotal + calcServiceCharge;

    if (isPg) {
        const sql = `INSERT INTO orders ("tableId", items, "finalTotal", subtotal, "serviceCharge", status, "orderType", "customerName", "phone", "sessionId") VALUES (?, ?, ?, ?, ?, 'new', ?, ?, ?, ?) RETURNING *`;
        const res = await runQuery(sql, [tableId.toString(), itemsJson, calcFinalTotal, calcSubtotal, calcServiceCharge, ot, cName, pNum, sId]);
        const row = res.rows[0];
        return { ...row, items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items };
    } else {
        const sql = `INSERT INTO orders (tableId, items, finalTotal, subtotal, serviceCharge, status, orderType, customerName, phone, sessionId) VALUES (?, ?, ?, ?, ?, 'new', ?, ?, ?, ?)`;
        const res = await runQuery(sql, [tableId.toString(), itemsJson, calcFinalTotal, calcSubtotal, calcServiceCharge, ot, cName, pNum, sId]);
        const selectRes = await runQuery(`SELECT * FROM orders WHERE id = ?`, [res.lastID]);
        const row = selectRes.rows[0];
        return { ...row, items: JSON.parse(row.items) };
    }
};

const allocateSession = async (tableId, sessionId) => {
    try {
        const existing = await getActiveSession(tableId);
        if (existing) {
            return existing.session_token === sessionId;
        }
        
        // No active session, create one
        await runQuery(`INSERT INTO qr_sessions (seating_id, session_token, status) VALUES (?, ?, 'ACTIVE')`, [tableId.toString(), sessionId]);
        return true;
    } catch (e) {
        console.error('Error allocating session:', e);
        return false;
    }
};

const getActiveSession = async (tableId) => {
    try {
        const res = await runQuery(`SELECT * FROM qr_sessions WHERE seating_id = ? AND status = 'ACTIVE' ORDER BY id DESC LIMIT 1`, [tableId.toString()]);
        return res.rows[0];
    } catch (e) {
        // Fallback for previous active_sessions if table schema is messed up momentarily
        const colTableId = isPg ? '"tableId"' : 'tableId';
        const res = await runQuery(`SELECT * FROM active_sessions WHERE ${colTableId} = ?`, [tableId.toString()]);
        return res.rows[0];
    }
};

const clearSession = async (tableId) => {
    const colTableId = isPg ? '"tableId"' : 'tableId';
    await runQuery(`DELETE FROM active_sessions WHERE ${colTableId} = ?`, [tableId.toString()]);
    
    // Mark qr_sessions as ENDED
    const now = new Date().toISOString();
    await runQuery(`UPDATE qr_sessions SET status = 'ENDED', end_time = ? WHERE seating_id = ? AND status = 'ACTIVE'`, [now, tableId.toString()]);
};

const updateOrderStatus = async (id, status) => {
    const oldOrderRes = await runQuery(`SELECT * FROM orders WHERE id = ?`, [id]);
    const oldOrder = oldOrderRes.rows[0];
    if (!oldOrder) throw new Error('Order not found');

    await runQuery(`UPDATE orders SET status = ? WHERE id = ?`, [status, id]);

    // Transition order to session table on acceptance
    if (status === 'accepted' || status === 'confirmed') {
        const orderData = {
            tableId: oldOrder.tableId,
            items: typeof oldOrder.items === 'string' ? JSON.parse(oldOrder.items) : oldOrder.items,
            finalTotal: oldOrder.finalTotal,
            subtotal: oldOrder.subtotal,
            serviceCharge: oldOrder.serviceCharge,
            orderType: oldOrder.orderType,
            customerName: oldOrder.customerName,
            phone: oldOrder.phone,
            sessionId: oldOrder.sessionId
        };
        await addOrderToSession(orderData);
        // Remove from raw orders table to prevent duplication/confusion
        await runQuery(`DELETE FROM orders WHERE id = ?`, [id]);
        return { ...orderData, status: 'confirmed', id: 'transitioned' }; // Return dummy for sync
    }

    if ((status === 'completed' || status === 'billed' || status === 'archived') && 
        (oldOrder.status !== 'completed' && oldOrder.status !== 'billed' && oldOrder.status !== 'archived')) {
        const items = typeof oldOrder.items === 'string' ? JSON.parse(oldOrder.items) : oldOrder.items;
        const today = new Date().toISOString().split('T')[0];
        for (const item of items) {
            if (isPg) {
                await runQuery(
                    `INSERT INTO item_sales (date, "itemName", "quantitySold", "totalRevenue") VALUES (?, ?, ?, ?) ON CONFLICT(date, "itemName") DO UPDATE SET "quantitySold" = item_sales."quantitySold" + EXCLUDED."quantitySold", "totalRevenue" = item_sales."totalRevenue" + EXCLUDED."totalRevenue"`,
                    [today, item.name, item.qty, item.price * item.qty]
                ).catch(e => console.error(e));
            } else {
                await runQuery(
                    `INSERT INTO item_sales (date, itemName, quantitySold, totalRevenue) VALUES (?, ?, ?, ?) ON CONFLICT(date, itemName) DO UPDATE SET quantitySold = quantitySold + excluded.quantitySold, totalRevenue = totalRevenue + excluded.totalRevenue`,
                    [today, item.name, item.qty, item.price * item.qty]
                ).catch(e => console.error(e));
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
    const colName = isPg ? '"tableId"' : 'tableId';
    // Archive orders
    await runQuery(`UPDATE orders SET status = 'archived' WHERE ${colName} = ? AND status IN ('completed', 'billed', 'accepted') AND ${isPg ? '"orderType"' : 'orderType'} != 'takeaway'`, [tableId.toString()]);
    // Archive sessions
    const res = await runQuery(`UPDATE table_sessions SET status = 'archived' WHERE ${colName} = ? AND status IN ('active', 'confirmed', 'billed', 'completed') AND ${isPg ? '"orderType"' : 'orderType'} != 'takeaway'`, [tableId.toString()]);
    
    // End active session
    await clearSession(tableId);

    return { tableId, changes: isPg ? res.rowCount : res.changes };
};

const getAnalyticsDaily = async (dateStr) => {
    const today = dateStr || new Date().toISOString().split('T')[0];
    const colDate = isPg ? '"createdAt"' : 'createdAt';
    const colTableId = isPg ? '"tableId"' : 'tableId';
    
    // We want orders from 'today' that are completed, billed, or archived
    const sql = isPg 
        ? `SELECT COUNT(*) as "totalOrders", SUM("finalTotal") as "grossRevenue", SUM(subtotal) as "subtotal", SUM("serviceCharge") as "serviceCharge" FROM orders WHERE CAST("${colDate.replace(/"/g, '')}" AS DATE) = ? AND status IN ('completed', 'billed', 'archived')`
        : `SELECT COUNT(*) as totalOrders, SUM(finalTotal) as grossRevenue, SUM(subtotal) as subtotal, SUM(serviceCharge) as serviceCharge FROM orders WHERE DATE(${colDate}) = ? AND status IN ('completed', 'billed', 'archived')`;
    
    const res = await runQuery(sql, [today]);
    const row = res.rows[0];
    
    return {
        totalOrders: parseInt(row.totalOrders || 0, 10),
        grossRevenue: parseFloat(row.grossRevenue || 0),
        subtotal: parseFloat(row.subtotal || 0),
        serviceCharge: parseFloat(row.serviceCharge || 0)
    };
};

const getItemAnalytics = async () => {
    const colName = isPg ? '"quantitySold"' : 'quantitySold';
    const res = await runQuery(`SELECT * FROM item_sales ORDER BY ${colName} DESC`);
    return res.rows;
};

const getAssistanceRequests = async () => {
    const colName = isPg ? '"createdAt"' : 'createdAt';
    const res = await runQuery(`SELECT * FROM assistance_requests ORDER BY ${colName} DESC`);
    return res.rows;
};

const createAssistanceRequest = async (tableId, type = 'staff') => {
    if (isPg) {
        const res = await runQuery(`INSERT INTO assistance_requests ("tableId", type, status) VALUES (?, ?, ?) RETURNING *`, [tableId, type, 'pending']);
        return res.rows[0];
    } else {
        const res = await runQuery(`INSERT INTO assistance_requests (tableId, type, status) VALUES (?, ?, ?)`, [tableId, type, 'pending']);
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

// Staff & Attendance DB logic
const getEmployees = async () => {
    const res = await runQuery(`SELECT * FROM employees ORDER BY id DESC`);
    return res.rows;
};

const createEmployee = async (name, phone, faceEmbedding = null) => {
    if (isPg) {
        const res = await runQuery(`INSERT INTO employees (name, phone, "faceEmbedding") VALUES (?, ?, ?) RETURNING *`, [name, phone, faceEmbedding]);
        return res.rows[0];
    } else {
        const res = await runQuery(`INSERT INTO employees (name, phone, faceEmbedding) VALUES (?, ?, ?)`, [name, phone, faceEmbedding]);
        const selectRes = await runQuery(`SELECT * FROM employees WHERE id = ?`, [res.lastID]);
        return selectRes.rows[0];
    }
};

const updateEmployee = async (id, name, phone) => {
    await runQuery(`UPDATE employees SET name = ?, phone = ? WHERE id = ?`, [name, phone, id]);
    const res = await runQuery(`SELECT * FROM employees WHERE id = ?`, [id]);
    return res.rows[0];
};

const deleteEmployee = async (id) => {
    await runQuery(`DELETE FROM employees WHERE id = ?`, [id]);
    // Also cleanup their attendance
    const empCol = isPg ? '"employeeId"' : 'employeeId';
    await runQuery(`DELETE FROM attendance WHERE ${empCol} = ?`, [id]);
    return { id };
};

const markAttendance = async (employeeId) => {
    const today = new Date().toISOString().split('T')[0];
    const empCol = isPg ? '"employeeId"' : 'employeeId';
    
    // Check if already marked today
    const existing = await runQuery(`SELECT * FROM attendance WHERE date = ? AND ${empCol} = ?`, [today, employeeId]);
    if (existing.rows && existing.rows.length > 0) {
        throw new Error('Already marked attendance for today');
    }

    if (isPg) {
        const res = await runQuery(`INSERT INTO attendance ("employeeId", date, verified) VALUES (?, ?, true) RETURNING *`, [employeeId, today]);
        return res.rows[0];
    } else {
        const res = await runQuery(`INSERT INTO attendance (employeeId, date, verified) VALUES (?, ?, 1)`, [employeeId, today]);
        const selectRes = await runQuery(`SELECT * FROM attendance WHERE id = ?`, [res.lastID]);
        return selectRes.rows[0];
    }
};

const getAttendanceToday = async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await runQuery(`SELECT * FROM attendance WHERE date = ?`, [today]);
    return res.rows;
};

// Menu Management
const getMenuItems = async () => {
    const res = await runQuery(`SELECT * FROM menu_items ORDER BY id ASC`);
    const nowStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    return res.rows.map(item => {
        let isTimedOut = false;
        if (item.availableFrom && item.availableTo) {
            if (item.availableFrom <= item.availableTo) {
                // Same day logic: 09:00 - 17:00
                isTimedOut = nowStr < item.availableFrom || nowStr > item.availableTo;
            } else {
                // Overnight logic: 22:00 - 05:00
                isTimedOut = nowStr < item.availableFrom && nowStr > item.availableTo;
            }
        }
        return { 
            ...item, 
            isAvailable: item.isAvailable && !isTimedOut,
            isTemporarilyUnavailable: item.isAvailable ? isTimedOut : false, // Fixed logic: only temp if generally available
            platterItems: typeof item.platterItems === 'string' ? JSON.parse(item.platterItems) : item.platterItems
        };
    });
};

const addMenuItem = async (item) => {
    const { name, price, category, image, description, platterItems } = item;
    const pi = platterItems ? JSON.stringify(platterItems) : null;
    if (isPg) {
        const res = await runQuery(
            `INSERT INTO menu_items (name, price, category, image, description, "platterItems") VALUES (?, ?, ?, ?, ?, ?) RETURNING *`, 
            [name, price, category, image, description, pi]
        );
        return res.rows[0];
    } else {
        const res = await runQuery(
            `INSERT INTO menu_items (name, price, category, image, description, platterItems) VALUES (?, ?, ?, ?, ?, ?)`, 
            [name, price, category, image, description, pi]
        );
        const selectRes = await runQuery(`SELECT * FROM menu_items WHERE id = ?`, [res.lastID]);
        return selectRes.rows[0];
    }
};

const updateMenuItem = async (id, item) => {
    const { name, price, category, image, description, isAvailable, platterItems } = item;
    const pi = platterItems ? JSON.stringify(platterItems) : null;
    if (isPg) {
        const res = await runQuery(
            `UPDATE menu_items SET name = ?, price = ?, category = ?, image = ?, description = ?, "isAvailable" = ?, "platterItems" = ? WHERE id = ? RETURNING *`, 
            [name, price, category, image, description, isAvailable, pi, id]
        );
        return res.rows[0];
    } else {
        await runQuery(
            `UPDATE menu_items SET name = ?, price = ?, category = ?, image = ?, description = ?, isAvailable = ?, platterItems = ? WHERE id = ?`, 
            [name, price, category, image, description, isAvailable, pi, id]
        );
        const selectRes = await runQuery(`SELECT * FROM menu_items WHERE id = ?`, [id]);
        return selectRes.rows[0];
    }
};

const deleteMenuItem = async (id) => {
    await runQuery(`DELETE FROM menu_items WHERE id = ?`, [id]);
    return { id };
};

const seedMenu = async (menuData) => {
    const existing = await getMenuItems();
    console.log(`Current menu size: ${existing.length}. Checking for missing items...`);
    
    let addedCount = 0;
    let updatedCount = 0;
    for (const item of menuData) {
        const existingItem = existing.find(ext => 
            ext.name.toLowerCase() === item.name.toLowerCase() && 
            ext.category.toLowerCase() === item.category.toLowerCase()
        );
        
        if (!existingItem) {
            await addMenuItem(item);
            addedCount++;
        } else if (existingItem.price !== item.price || (item.image && existingItem.image !== item.image)) {
            await updateMenuItem(existingItem.id, { ...existingItem, price: item.price, image: item.image });
            updatedCount++;
        }
    }
    
    if (addedCount > 0 || updatedCount > 0) {
        console.log(`Successfully seeded ${addedCount} new items and updated images for ${updatedCount} items.`);
    } else {
        console.log('Menu is already up to date with seed data.');
    }
};

const updateMenuItemStatus = async (id, isAvailable, until = null) => {
    await runQuery(
        `UPDATE menu_items SET "isAvailable" = ?, "unavailableUntil" = ? WHERE id = ?`, 
        [isAvailable ? (isPg ? true : 1) : (isPg ? false : 0), until, id]
    ).catch(async () => {
        await runQuery(
            `UPDATE menu_items SET isAvailable = ?, unavailableUntil = ? WHERE id = ?`, 
            [isAvailable ? (isPg ? true : 1) : (isPg ? false : 0), until, id]
        );
    });
    const res = await runQuery(`SELECT * FROM menu_items WHERE id = ?`, [id]);
    return res.rows[0];
};

const updateCategoryItemStatus = async (category, isAvailable, until = null) => {
    await runQuery(
        `UPDATE menu_items SET "isAvailable" = ?, "unavailableUntil" = ? WHERE category = ?`, 
        [isAvailable ? (isPg ? true : 1) : (isPg ? false : 0), until, category]
    ).catch(async () => {
        await runQuery(
            `UPDATE menu_items SET isAvailable = ?, unavailableUntil = ? WHERE category = ?`, 
            [isAvailable ? (isPg ? true : 1) : (isPg ? false : 0), until, category]
        );
    });
    return true;
};

const checkMenuAvailabilityReset = async () => {
    const now = new Date().toISOString();
    const colName = isPg ? '"unavailableUntil"' : 'unavailableUntil';
    const availCol = isPg ? '"isAvailable"' : 'isAvailable';
    
    const sql = `UPDATE menu_items SET ${availCol} = ${isPg ? 'true' : '1'}, ${colName} = NULL WHERE ${colName} IS NOT NULL AND ${colName} < ?`;
    const res = await runQuery(sql, [now]);
    return isPg ? res.rowCount : res.changes;
};

const getSessionsByStatus = async (statuses) => {
    const placeholders = statuses.map(() => '?').join(',');
    const sql = isPg ? `SELECT * FROM table_sessions WHERE status IN (${placeholders}) ORDER BY "createdAt" DESC` : `SELECT * FROM table_sessions WHERE status IN (${placeholders}) ORDER BY createdAt DESC`;
    const res = await runQuery(sql, statuses);
    return res.rows.map(row => ({ ...row, items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items }));
};

const updateSessionStatus = async (id, status) => {
    const oldRes = await runQuery(`SELECT * FROM table_sessions WHERE id = ?`, [id]);
    const oldSession = oldRes.rows[0];
    if (!oldSession) throw new Error('Session not found');

    await runQuery(`UPDATE table_sessions SET status = ? WHERE id = ?`, [status, id]);

    // Handle analytics on completion
    if ((status === 'completed' || status === 'billed') && (oldSession.status === 'active' || oldSession.status === 'confirmed')) {
        const items = typeof oldSession.items === 'string' ? JSON.parse(oldSession.items) : oldSession.items;
        const today = new Date().toISOString().split('T')[0];
        for (const item of items) {
            const itemSql = isPg
                ? `INSERT INTO item_sales (date, "itemName", "quantitySold", "totalRevenue") VALUES (?, ?, ?, ?) ON CONFLICT(date, "itemName") DO UPDATE SET "quantitySold" = item_sales."quantitySold" + EXCLUDED."quantitySold", "totalRevenue" = item_sales."totalRevenue" + EXCLUDED."totalRevenue"`
                : `INSERT INTO item_sales (date, itemName, quantitySold, totalRevenue) VALUES (?, ?, ?, ?) ON CONFLICT(date, itemName) DO UPDATE SET quantitySold = quantitySold + excluded.quantitySold, totalRevenue = totalRevenue + excluded.totalRevenue`;
            await runQuery(itemSql, [today, item.name, item.qty, item.price * item.qty]).catch(e => console.error(e));
        }
    }
    
    const newRes = await runQuery(`SELECT * FROM table_sessions WHERE id = ?`, [id]);
    const row = newRes.rows[0];
    return { ...row, items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items };
};

const getTableStatuses = async () => {
    const res = await runQuery(`SELECT * FROM table_status`);
    return res.rows;
};

const updateTableStatus = async (tableId, status) => {
    const today = new Date().toISOString();
    console.log(`[DB] Updating Table ${tableId} to status: ${status}`);
    const sql = isPg 
        ? `INSERT INTO table_status ("tableId", status, "updatedAt") VALUES (?, ?, ?) ON CONFLICT("tableId") DO UPDATE SET status = EXCLUDED.status, "updatedAt" = EXCLUDED."updatedAt" RETURNING *`
        : `INSERT INTO table_status (tableId, status, updatedAt) VALUES (?, ?, ?) ON CONFLICT(tableId) DO UPDATE SET status = excluded.status, updatedAt = excluded.updatedAt`;
        
    try {
        if (isPg) {
            const res = await runQuery(sql, [tableId.toString(), status, today]);
            return res.rows[0];
        } else {
            await runQuery(sql, [tableId.toString(), status, today]);
            const sel = await runQuery(`SELECT * FROM table_status WHERE tableId = ?`, [tableId.toString()]);
            return sel.rows[0];
        }
    } catch (err) {
        console.error(`[DB] Failed to update table status for ${tableId}:`, err.message);
        throw err;
    }
};

const getSessionsByTable = async (tableId, statuses) => {
    const placeholders = statuses.map(() => '?').join(',');
    const colName = isPg ? '"tableId"' : 'tableId';
    const sql = isPg 
        ? `SELECT * FROM table_sessions WHERE ${colName} = ? AND status IN (${placeholders}) ORDER BY "createdAt" DESC` 
        : `SELECT * FROM table_sessions WHERE tableId = ? AND status IN (${placeholders}) ORDER BY createdAt DESC`;
    const res = await runQuery(sql, [tableId.toString(), ...statuses]);
    return res.rows.map(row => ({ ...row, items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items }));
};

const getOrdersByTable = async (tableId, statuses) => {
    const placeholders = statuses.map(() => '?').join(',');
    const colName = isPg ? '"tableId"' : 'tableId';
    const sql = isPg 
        ? `SELECT * FROM orders WHERE ${colName} = ? AND status IN (${placeholders}) ORDER BY "createdAt" DESC` 
        : `SELECT * FROM orders WHERE tableId = ? AND status IN (${placeholders}) ORDER BY createdAt DESC`;
    const res = await runQuery(sql, [tableId.toString(), ...statuses]);
    return res.rows.map(row => ({ ...row, items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items }));
};

const updatePrepTime = async (id, minutes, type = 'session') => {
    const table = type === 'session' ? 'table_sessions' : 'orders';
    const now = new Date().toISOString();
    const colPrep = isPg ? '"prepTime"' : 'prepTime';
    const colStarted = isPg ? '"prepStartedAt"' : 'prepStartedAt';
    
    await runQuery(`UPDATE ${table} SET ${colPrep} = ?, ${colStarted} = ? WHERE id = ?`, [minutes, now, id]);
    const res = await runQuery(`SELECT * FROM ${table} WHERE id = ?`, [id]);
    const row = res.rows[0];
    if (!row) throw new Error(`${type} with id ${id} not found`);
    
    let items = row.items;
    if (typeof items === 'string') {
        try { items = JSON.parse(items); } catch(e) { items = []; }
    }
    return { ...row, items };
};

const getUnavailabilitySchedules = async () => {
    const res = await runQuery(`SELECT * FROM unavailability_schedules ORDER BY id DESC`);
    return res.rows;
};

const createUnavailabilitySchedule = async (data) => {
    const { itemIds, category, type, startDate, startTime, endTime, daysOfWeek, label } = data;
    const itemIdsStr = itemIds ? JSON.stringify(itemIds) : null;
    
    if (isPg) {
        const sql = `INSERT INTO unavailability_schedules ("itemIds", category, type, "startDate", "startTime", "endTime", "daysOfWeek", label) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`;
        const res = await runQuery(sql, [itemIdsStr, category || null, type, startDate || null, startTime, endTime, daysOfWeek || null, label || null]);
        return res.rows[0];
    } else {
        const sql = `INSERT INTO unavailability_schedules (itemIds, category, type, startDate, startTime, endTime, daysOfWeek, label) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        const res = await runQuery(sql, [itemIdsStr, category || null, type, startDate || null, startTime, endTime, daysOfWeek || null, label || null]);
        const sel = await runQuery(`SELECT * FROM unavailability_schedules WHERE id = ?`, [res.lastID]);
        return sel.rows[0];
    }
};

const updateUnavailabilitySchedule = async (id, data) => {
    const { itemIds, category, type, startDate, startTime, endTime, daysOfWeek, isEnabled, label } = data;
    const itemIdsStr = itemIds ? JSON.stringify(itemIds) : null;
    
    const colItemIds = isPg ? '"itemIds"' : 'itemIds';
    const colStartDate = isPg ? '"startDate"' : 'startDate';
    const colStartTime = isPg ? '"startTime"' : 'startTime';
    const colEndTime = isPg ? '"endTime"' : 'endTime';
    const colDays = isPg ? '"daysOfWeek"' : 'daysOfWeek';
    const colEnabled = isPg ? '"isEnabled"' : 'isEnabled';

    const sql = `UPDATE unavailability_schedules SET ${colItemIds} = ?, category = ?, type = ?, ${colStartDate} = ?, ${colStartTime} = ?, ${colEndTime} = ?, ${colDays} = ?, ${colEnabled} = ?, label = ? WHERE id = ?`;
    await runQuery(sql, [itemIdsStr, category || null, type, startDate || null, startTime, endTime, daysOfWeek || null, isEnabled ? (isPg ? true : 1) : (isPg ? false : 0), label || null, id]);
    
    const res = await runQuery(`SELECT * FROM unavailability_schedules WHERE id = ?`, [id]);
    return res.rows[0];
};

const deleteUnavailabilitySchedule = async (id) => {
    await runQuery(`DELETE FROM unavailability_schedules WHERE id = ?`, [id]);
    return { id };
};

const processSchedulesTask = async () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    const dayOfWeek = now.getDay().toString(); // 0 (Sun) to 6 (Sat)

    const schedules = await getUnavailabilitySchedules();
    const activeSchedules = schedules.filter(s => {
        if (!s.isEnabled) return false;
        
        // 1. Check time range
        let inTimeRange = false;
        if (s.startTime <= s.endTime) {
            inTimeRange = timeStr >= s.startTime && timeStr <= s.endTime;
        } else {
            // Overnight range
            inTimeRange = timeStr >= s.startTime || timeStr <= s.endTime;
        }
        if (!inTimeRange) return false;

        // 2. Check type specific conditions
        if (s.type === 'one-time') {
            const sDate = s.startDate instanceof Date ? s.startDate.toISOString().split('T')[0] : s.startDate;
            return sDate === todayStr;
        }
        if (s.type === 'weekly') {
            const days = s.daysOfWeek ? s.daysOfWeek.split(',') : [];
            return days.includes(dayOfWeek);
        }
        return s.type === 'daily'; // Daily only needs time range
    });

    const itemsToDisable = new Map(); // id -> endTime
    for (const s of activeSchedules) {
        if (s.category) {
            const catItems = await runQuery(`SELECT id FROM menu_items WHERE category = ?`, [s.category]);
            catItems.rows.forEach(r => itemsToDisable.set(r.id, s.endTime));
        }
        if (s.itemIds) {
            try {
                const ids = JSON.parse(s.itemIds);
                ids.forEach(id => itemsToDisable.set(id, s.endTime));
            } catch (e) {}
        }
    }

    // Update menu_items availability
    const allItems = await getMenuItems();
    let changeCount = 0;
    for (const item of allItems) {
        const scheduleEndTime = itemsToDisable.get(item.id);
        const shouldBeUnavailable = !!scheduleEndTime;
        const currentlyAvailable = isPg ? (item.isAvailable === true) : (item.isAvailable === 1);
        
        if (shouldBeUnavailable && currentlyAvailable) {
            // Calculate "until" timestamp for today
            const untilDate = new Date();
            const [h, m] = scheduleEndTime.split(':');
            untilDate.setHours(parseInt(h), parseInt(m), 0, 0);
            await updateMenuItemStatus(item.id, false, untilDate.toISOString());
            changeCount++;
        } else if (!shouldBeUnavailable && !currentlyAvailable && !item.unavailableUntil) {
            // Only auto-enable if it's NOT manually locked (manual locks set unavailableUntil)
            await updateMenuItemStatus(item.id, true);
            changeCount++;
        }
    }
    return changeCount;
};

module.exports = {
    db, pgPool, runQuery, isPg, getOrdersByStatus, createOrder, addOrderToSession, updateOrderStatus,
    deleteOrder, clearTableOrders, getAnalyticsDaily, getItemAnalytics,
    getAssistanceRequests, createAssistanceRequest, updateAssistanceStatus, deleteAssistanceRequest,
    getEmployees, createEmployee, updateEmployee, deleteEmployee, markAttendance, getAttendanceToday,
    getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem, seedMenu,
    updateMenuItemStatus, checkMenuAvailabilityReset, getSessionsByStatus, updateSessionStatus, updateCategoryItemStatus,
    getTableStatuses, updateTableStatus, getSessionsByTable, getOrdersByTable,
    allocateSession, getActiveSession, clearSession, updatePrepTime,
    getUnavailabilitySchedules, createUnavailabilitySchedule, updateUnavailabilitySchedule, deleteUnavailabilitySchedule, processSchedulesTask
};
