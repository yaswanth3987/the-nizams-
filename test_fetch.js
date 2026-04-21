async function test() {
    console.log("Testing connection...");
    try {
        const res = await fetch("https://the-nizams.onrender.com/api/menu");
        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Data length:", data.length);
    } catch (e) {
        console.error("Error:", e.message);
    }
}
test();
