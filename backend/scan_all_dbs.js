const sqlite3 = require('sqlite3').verbose();

const checkDb = (filename) => {
    return new Promise((resolve) => {
        const db = new sqlite3.Database(filename);
        console.log(`\nðŸ”Ž Checking ${filename}...`);
        db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
            if (err || !tables) {
                console.log(`âŒ Could not read ${filename}`);
                resolve();
                return;
            }
            console.log("Tables:", tables.map(t => t.name).join(', '));
            const inv = tables.find(t => t.name.toLowerCase().includes('inventory'))?.name;
            if (inv) {
                db.all(`SELECT * FROM ${inv}`, (err, rows) => {
                    if (!err && rows && rows.length > 0) {
                        console.log(`✅ FOUND DATA in ${filename} (${inv} table): ${rows.length} rows`);
                        console.log(JSON.stringify(rows.slice(0, 5), null, 2)); // Show first 5
                    } else {
                        console.log(`Empty or missing data in ${filename}`);
                    }
                    db.close();
                    resolve();
                });
            } else {
                db.close();
                resolve();
            }
        });
    });
};

async function run() {
    await checkDb('nizam.db');
    await checkDb('database.sqlite');
    await checkDb('nizam_pos.sqlite');
}

run();
