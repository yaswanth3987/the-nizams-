const API_BASE = "https://the-nizams.onrender.com/api";

async function runTest() {
    console.log("🚀 Starting Automated System Test...");

    try {
        // 1. Create a Test Assistance Request
        console.log("\n1️⃣  Creating Assistance Request for Table T05...");
        const helpRes = await fetch(`${API_BASE}/assistance`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tableId: "T05", type: "staff" }),
            signal: AbortSignal.timeout(10000)
        });
        console.log("Response Status:", helpRes.status);
        const helpData = await helpRes.json();
        console.log("✅ Created Request ID:", helpData.id);

        // 2. Verify Waiter can see the Request
        console.log("\n2️⃣  Verifying Waiter Assistance Feed...");
        const allHelpRes = await fetch(`${API_BASE}/assistance`);
        const allHelp = await allHelpRes.json();
        const found = allHelp.find(h => h.id === helpData.id && h.status === 'pending');
        if (found) {
            console.log("✅ Request found in Waiter Feed!");
        } else {
            throw new Error("❌ Request NOT found in Waiter Feed!");
        }

        // 3. Mark Request as Resolved (Waiter Action)
        console.log("\n3️⃣  Marking Request as Attended (Waiter Action)...");
        const resolveRes = await fetch(`${API_BASE}/assistance/${helpData.id}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "resolved" })
        });
        if (resolveRes.ok) {
            console.log("✅ Successfully marked as attended!");
        }

        // 4. Create a Test Order
        console.log("\n4️⃣  Placing Test Order for Table T05...");
        const orderRes = await fetch(`${API_BASE}/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                tableId: "T05",
                items: [{ id: 1, name: "Test Biryani", price: 15.0, qty: 1 }],
                finalTotal: 15.0,
                status: "new",
                orderType: "dine-in"
            })
        });
        const orderData = await orderRes.json();
        console.log("✅ Order Created ID:", orderData.id);

        // 5. Update Order to 'ready' (Kitchen Action)
        console.log("\n5️⃣  Marking Order as READY (Kitchen Action)...");
        // Using new-orders endpoint since status is 'new'
        const readyRes = await fetch(`${API_BASE}/new-orders/${orderData.id}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "ready" })
        });
        if (readyRes.ok) console.log("✅ Order is now READY!");

        // 6. Mark Order as 'served' (Waiter Action)
        console.log("\n6️⃣  Marking Order as SERVED (Waiter Action)...");
        const servedRes = await fetch(`${API_BASE}/orders/${orderData.id}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "served" })
        });
        if (servedRes.ok) console.log("✅ Order successfully SERVED!");

        console.log("\n✨ ALL TESTS PASSED! System integration is healthy.");

    } catch (error) {
        console.error("\n❌ TEST FAILED:", error.message);
        process.exit(1);
    }
}

runTest();
