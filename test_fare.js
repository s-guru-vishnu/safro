const { calculateEstimatedFare } = require('./server/src/services/fareService');

async function testFare() {
    console.log("Testing Fare Estimation Service...");

    // Coimbatore approx coordinates
    const pickup = { lat: 11.0168, lng: 76.9558 };
    const drop = { lat: 11.0055, lng: 76.9715 };

    try {
        const estimate = await calculateEstimatedFare(pickup, drop);
        console.log("Success! Extracted Estimate:", JSON.stringify(estimate, null, 2));
    } catch (err) {
        console.error("Test failed:", err);
    }
}

testFare();
