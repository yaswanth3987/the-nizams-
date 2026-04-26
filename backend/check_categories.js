const { Database } = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'nizam.db');
const db = new Database(dbPath);

db.all("SELECT category, COUNT(*) as count FROM menu_items GROUP BY category", (err, rows) => {
    if (err) console.error(err);
    else {
        rows.forEach(r => console.log(`${r.category}: ${r.count}`));
    }
    db.close();
});
