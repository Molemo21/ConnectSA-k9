// Simple test script to check if the services API is working
const fetch = require('node-fetch');

async function testServicesAPI() {
  try {
    console.log('🔍 Testing /api/services endpoint...');
    
    const response = await fetch('http://localhost:3000/api/services');
    console.log('📊 Response status:', response.status);
    console.log('📊 Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Services data:', data);
    console.log('📈 Services count:', data.length);
    
    if (data.length > 0) {
      console.log('🎉 API is working correctly!');
      console.log('📋 First service:', data[0]);
    } else {
      console.log('⚠️ No services found in database');
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testServicesAPI();

