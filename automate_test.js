const API_BASE = "https://the-nizams.onrender.com/api";

async function runTest() {
    console.log("⏳ Waiting for server to wake up...");
    let attempts = 0;
    while (attempts < 20) {
        try {
            const check = await fetch(`${API_BASE}/menu`, { signal: AbortSignal.timeout(10000) });
            if (check.ok) break;
        } catch (e) {}
        attempts++;
        process.stdout.write(".");
        await new Promise(r => setTimeout(r, 10000));
    }
    console.log("\n🚀 Server is UP. Starting Automated System Test...");

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

        // 4. Create a Test Order (Staff Order)
        console.log("\n4️⃣  Placing Staff Test Order for Table T05...");
        const orderRes = await fetch(`${API_BASE}/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                tableId: "T05",
                items: [{ id: 1, name: "Staff Test Biryani", price: 15.0, qty: 1 }],
                finalTotal: 15.0,
                status: "new",
                orderType: "dine-in",
                isStaff: true
            }),
            signal: AbortSignal.timeout(15000)
        });
        const orderData = await orderRes.json();
        console.log("✅ Staff Order Created ID:", orderData.id);

        // 5. Accept the Order (Simulate Waiter/Admin Action)
        console.log("\n5️⃣  Accepting Order (Transitioning to Session)...");
        const acceptRes = await fetch(`${API_BASE}/new-orders/${orderData.id}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "accepted" }),
            signal: AbortSignal.timeout(15000)
        });
        if (acceptRes.ok) {
            console.log("✅ Order Accepted & Transitioned!");
        } else {
            const err = await acceptRes.json();
            throw new Error(`❌ Acceptance failed: ${err.error}`);
        }

        // 6. Verify it's now in Sessions
        console.log("\n6️⃣  Verifying Order in Sessions Feed...");
        const sessionRes = await fetch(`${API_BASE}/orders`);
        const sessions = await sessionRes.json();
        const transitioned = sessions.find(s => s.tableId === "T05");
        if (transitioned) {
            console.log("✅ Order successfully found in Sessions table!");
        } else {
            throw new Error("❌ Order DISAPPEARED after transition!");
        }

        console.log("\n✨ ALL TESTS PASSED! System integration is healthy.");

    } catch (error) {
        console.error("\n❌ TEST FAILED:", error.message);
        process.exit(1);
    }
}

runTest();
