/**
 * Test script for the complete job API endpoint
 * This script tests the /api/book-service/[id]/complete endpoint
 */

const testCompleteJob = async () => {
  const bookingId = "test-booking-id"; // Replace with actual booking ID
  const testData = {
    photos: ["https://example.com/photo1.jpg"],
    notes: "Job completed successfully"
  };

  try {
    console.log("🧪 Testing complete job API...");
    console.log(`📋 Booking ID: ${bookingId}`);
    console.log(`📝 Test data:`, testData);

    const response = await fetch(`http://localhost:3000/api/book-service/${bookingId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real test, you'd need to include authentication headers
        // 'Cookie': 'auth-token=your-token-here'
      },
      body: JSON.stringify(testData)
    });

    console.log(`📊 Response status: ${response.status}`);
    
    const result = await response.json();
    console.log(`📄 Response data:`, result);

    if (response.ok) {
      console.log("✅ Complete job API test passed!");
      console.log(`🎯 Booking status: ${result.booking?.status}`);
      console.log(`💬 Message: ${result.message}`);
    } else {
      console.log("❌ Complete job API test failed!");
      console.log(`🚨 Error: ${result.error}`);
      if (result.details) {
        console.log(`📋 Details:`, result.details);
      }
    }

  } catch (error) {
    console.error("💥 Test error:", error.message);
  }
};

// Run the test
testCompleteJob();
