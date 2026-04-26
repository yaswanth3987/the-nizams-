const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('nizam.db');

db.serialize(() => {
    console.log("â³ Merging WAL into DB...");
    db.run("PRAGMA wal_checkpoint(FULL);", (err) => {
        if (err) console.error(err);
        
        console.log("ðŸ”Ž Checking inventory table again...");
        db.all("SELECT * FROM inventory", (err, rows) => {
            if (err) {
                console.error("âŒ Inventory table error:", err.message);
            } else if (rows && rows.length > 0) {
                console.log(`âœ… SUCCESS! Found ${rows.length} inventory items.`);
                console.log(JSON.stringify(rows, null, 2));
            } else {
                console.log("âŒ Inventory table is still empty.");
            }
            db.close();
        });
    });
});
