const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('nizam.db');

db.serialize(() => {
    // List all tables
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log("Tables found:", tables.map(t => t.name).join(', '));
        
        // Try to find inventory table
        const inventoryTable = tables.find(t => t.name.toLowerCase().includes('inventory'))?.name;
        
        if (inventoryTable) {
            console.log(`\n--- Data from ${inventoryTable} ---`);
            db.all(`SELECT * FROM ${inventoryTable}`, (err, rows) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log(JSON.stringify(rows, null, 2));
                }
                db.close();
            });
        } else {
            console.log("\nâŒ No inventory table found in local nizam.db.");
            db.close();
        }
    });
});
