const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'nizam.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
        return;
    }
    console.log('Connected to local SQLite database.');
    db.all("SELECT id, name, price FROM menu_items WHERE name = 'WATER BOTTLE'", (err, rows) => {
        if (err) {
            console.error('Error running query', err.message);
        } else {
            console.log('Results:', rows);
        }
        db.close();
    });
});
