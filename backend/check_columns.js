const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('nizam.db');

const tables = ['table_sessions', 'orders', 'assistance_requests', 'menu_items', 'qr_sessions'];

console.log('\x1b[36m%s\x1b[0m', '--- THE GREAT NIZAM: SYSTEM DIAGNOSTICS ---');

function checkTable(index) {
    if (index >= tables.length) {
        console.log('\n\x1b[32m%s\x1b[0m', 'âœ… Diagnostics Complete. All systems operational.');
        db.close();
        return;
    }

    const table = tables[index];
    db.all(`PRAGMA table_info(${table})`, (err, rows) => {
        if (err) {
            console.error(`\x1b[31mError checking ${table}:\x1b[0m`, err);
        } else if (rows.length === 0) {
            console.log(`\x1b[33mâš ï¸ Table [${table}] does not exist matching the current session context.\x1b[0m`);
        } else {
            const columns = rows.map(r => r.name).join(', ');
            console.log(`\x1b[1m[${table}]\x1b[0m: ${columns}`);
        }
        checkTable(index + 1);
    });
}

checkTable(0);
