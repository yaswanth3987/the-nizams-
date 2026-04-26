const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('nizam.db');

db.serialize(() => {
    db.all("SELECT COUNT(*) as count FROM orders", (err, rows) => {
        if (err) console.error(err);
        else console.log(`Orders in nizam.db: ${rows[0].count}`);
    });
    
    db.all("SELECT COUNT(*) as count FROM table_sessions", (err, rows) => {
        if (err) console.error(err);
        else console.log(`Sessions in nizam.db: ${rows[0].count}`);
    });

    db.all("SELECT * FROM orders LIMIT 1", (err, rows) => {
        if (err) console.error(err);
        else if (rows.length > 0) console.log("Sample Order:", JSON.stringify(rows[0], null, 2));
    });
    
    db.close();
});
