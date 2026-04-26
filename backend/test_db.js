const { Pool } = require('pg');

// Requirement 5: Debugging & Masking
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error("âŒ Error: DATABASE_URL not found in environment.");
    process.exit(1);
}

const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
console.log(`[Test] Connecting to: ${maskedUrl}`);

const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
});

console.log("Requirement 6: Validating connection with 'SELECT 1'...");

pool.query('SELECT NOW() as time, version() as version', (err, res) => {
    if (err) {
        if (err.code === '28P01') console.error("âŒ Auth Failed: Incorrect password.");
        else if (err.code === 'ENETUNREACH') console.error("âŒ Network Failed: Cannot reach host (ENETUNREACH). Use the IPv4 Pooler host.");
        else console.error("âŒ Connection Failed:", err.message);
        process.exit(1);
    } else {
        console.log("âœ… SUCCESS!");
        console.log("Server Time:", res.rows[0].time);
        console.log("Postgres Version:", res.rows[0].version);
        console.log("\nYour connection is stable and authenticated.");
    }
    pool.end();
});
