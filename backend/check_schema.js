const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('backend/nizam.db');

db.all("PRAGMA table_info(table_sessions)", (err, rows) => {
    if (err) console.error(err);
    console.log('table_sessions:', rows.map(r => r.name).join(', '));
    db.all("PRAGMA table_info(orders)", (err, rows) => {
        if (err) console.error(err);
        console.log('orders:', rows.map(r => r.name).join(', '));
        db.all("PRAGMA table_info(menu_items)", (err, rows) => {
            if (err) console.error(err);
            console.log('menu_items:', rows.map(r => r.name).join(', '));
            db.close();
        });
    });
});
