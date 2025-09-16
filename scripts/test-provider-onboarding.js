const testProviderOnboarding = async () => {
  const testData = {
    businessName: "Test Plumbing Services",
    description: "Professional plumbing services for residential and commercial properties. Specializing in pipe repairs, installations, and maintenance.",
    experience: 5,
    hourlyRate: 500,
    location: "Cape Town, South Africa",
    selectedServices: ["123e4567-e89b-12d3-a456-426614174000"], // Using the mapped service ID
    idDocument: "test_id_document.pdf",
    proofOfAddress: "test_proof_of_address.pdf",
    certifications: ["plumbing_certificate.pdf"],
    profileImages: ["profile1.jpg", "profile2.jpg"],
    bankName: "Standard Bank",
    bankCode: "051",
    accountNumber: "1234567890",
    accountName: "Test Plumbing Services"
  };

  try {
    console.log('Testing provider onboarding API...');
    console.log('Test data:', JSON.stringify(testData, null, 2));

    const response = await fetch('http://localhost:3000/api/provider/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const result = await response.json();
    console.log('Response body:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ Provider onboarding test successful!');
    } else {
      console.log('❌ Provider onboarding test failed!');
    }
  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

// Run the test
testProviderOnboarding();