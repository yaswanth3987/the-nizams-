async function debug() {
    const API_BASE = "https://the-nizams.onrender.com/api";
    console.log("Testing POST /assistance...");
    const start = Date.now();
    try {
        const res = await fetch(`${API_BASE}/assistance`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tableId: "DEBUG", type: "staff" })
        });
        const data = await res.json();
        console.log("Success!", data);
        console.log("Time taken:", (Date.now() - start) / 1000, "s");
    } catch (e) {
        console.error("Error:", e.message);
        console.log("Time taken until error:", (Date.now() - start) / 1000, "s");
    }
}

debug();
