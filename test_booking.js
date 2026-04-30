async function testBooking() {
    const testData = {
        name: "Test User",
        phone: "1234567890",
        email: "test@example.com",
        party_size: 4,
        bookingDate: "2026-12-25", // Future date
        bookingTime: "19:00",
        seatingId: "table-1",
        seatingType: "table"
    };

    try {
        console.log("Attempting test booking via native fetch...");
        const response = await fetch('https://the-great-nizam.onrender.com/api/waitlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });
        
        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Response Data:", data);
        
        if (response.ok) {
            console.log("\n✅ SUCCESS: API is live and accepting bookings!");
        } else {
            console.log("\n❌ FAILED: API returned an error.");
        }
    } catch (error) {
        console.error("\n❌ CONNECTION ERROR:", error.message);
    }
}

testBooking();
