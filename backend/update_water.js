const db = require('better-sqlite3')('nizam.db');
db.prepare("UPDATE menu SET price = 1.99 WHERE name = 'WATER BOTTLE'").run();
console.log(db.prepare("SELECT * FROM menu WHERE name = 'WATER BOTTLE'").get());
