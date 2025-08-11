// Simple test script for provider discovery API
async function testProviderDiscovery() {
  try {
    console.log('🧪 Testing Provider Discovery API...')
    
    const response = await fetch('http://localhost:3000/api/book-service/discover-providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: 'haircut-service',
        date: '2024-08-15',
        time: '14:00',
        address: '123 Test Street, Test City'
      })
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Provider Discovery Success!')
      console.log(`Found ${data.totalCount} providers`)
      console.log('Providers:', data.providers.map(p => ({
        id: p.id,
        name: p.businessName || p.user.name,
        service: p.service.name,
        rating: p.averageRating,
        rate: p.hourlyRate
      })))
    } else {
      const error = await response.text()
      console.log('❌ Provider Discovery Failed:', response.status)
      console.log('Error:', error)
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

// Run test if this script is executed directly
if (typeof window === 'undefined') {
  testProviderDiscovery()
} 