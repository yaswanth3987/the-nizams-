
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./backend/nizam.db');

db.all("SELECT * FROM table_status", [], (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log("TABLE STATUS DATA:");
    console.table(rows);
    db.close();
});
