async function testDoubleBooking() {
    const testData = {
        name: "Second User",
        phone: "0987654321",
        email: "second@example.com",
        party_size: 2,
        bookingDate: "2026-12-25", // SAME DATE
        bookingTime: "19:30",     // WITHIN 90 MINUTES of the 19:00 booking
        seatingId: "table-1",    // SAME TABLE
        seatingType: "table"
    };

    try {
        console.log("Attempting double booking (should fail)...");
        const response = await fetch('https://the-great-nizam.onrender.com/api/waitlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });
        
        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Response Data:", data);
        
        if (response.status === 409) {
            console.log("\n✅ SUCCESS: Double-booking prevention is working perfectly! (Blocked overlap)");
        } else if (response.ok) {
            console.log("\n❌ FAILED: API allowed a double booking. Overlap window check failed.");
        } else {
            console.log("\n❌ ERROR: Unexpected response status:", response.status);
        }
    } catch (error) {
        console.error("\n❌ CONNECTION ERROR:", error.message);
    }
}

testDoubleBooking();
