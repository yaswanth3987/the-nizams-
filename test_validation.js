async function testValidation() {
    const testData = {
        name: "A", // TOO SHORT (min 2)
        phone: "invalid-phone", // INVALID FORMAT
        email: "test@example.com",
        party_size: 100, // TOO LARGE (max 30)
        bookingDate: "2020-01-01", // PAST DATE
        bookingTime: "12:00",
        seatingId: "table-1",
        seatingType: "table"
    };

    try {
        console.log("Attempting invalid booking (should fail validation)...");
        const response = await fetch('https://the-great-nizam.onrender.com/api/waitlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });
        
        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Response Error:", data.error);
        
        if (response.status === 400) {
            console.log("\n✅ SUCCESS: Input validation is working! (Blocked invalid data)");
        } else {
            console.log("\n❌ FAILED: API allowed invalid data.");
        }
    } catch (error) {
        console.error("\n❌ CONNECTION ERROR:", error.message);
    }
}

testValidation();
