const { Database } = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'nizam.db');
const db = new Database(dbPath);

db.get("SELECT COUNT(*) as count FROM menu_items", (err, row) => {
    if (err) console.error(err);
    else console.log(`Menu Items Count: ${row.count}`);
    db.close();
});
