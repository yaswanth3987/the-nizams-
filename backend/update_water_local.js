const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'nizam.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
        return;
    }
    console.log('Connected to local SQLite database.');
    db.run("UPDATE menu_items SET price = 1.50 WHERE name = 'WATER BOTTLE'", function(err) {
        if (err) {
            console.error('Error updating price', err.message);
        } else {
            console.log(`Updated ${this.changes} row(s).`);
            db.all("SELECT id, name, price FROM menu_items WHERE name = 'WATER BOTTLE'", (err, rows) => {
                if (!err) console.log('Current status:', rows);
                db.close();
            });
        }
    });
});
