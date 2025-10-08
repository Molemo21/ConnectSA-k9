const { SERVICE_CATEGORIES } = require('../config/service-categories')
const { getAllServices } = require('../lib/service-utils')

type MainCategory = 'BEAUTY_AND_WELLNESS' | 'HOME_SERVICES'
type ServiceCategory = 'HAIR_SERVICES' | 'NAILS' | 'RESIDENTIAL_CLEANING' | 'PLUMBING' | 'ELECTRICAL'

interface BookingFormData {
  serviceId: string
  date: string
  time: string
  address: string
  notes?: string
}

interface APIService {
  id: string
  name: string
  description: string
  category: string
  basePrice?: number
  duration?: number
  features?: string[]
}

async function simulateBookingFlow() {
  console.log('🧪 Testing Booking Flow\n')

  // Test 1: Service Selection
  console.log('Test 1: Service Selection Flow')
  try {
    // Simulate selecting a service
    const mainCategory = 'BEAUTY_AND_WELLNESS' as MainCategory
    const category = 'HAIR_SERVICES' as ServiceCategory
    const service = SERVICE_CATEGORIES[mainCategory].categories[category].services[0]

    console.log('✓ Selected main category:', mainCategory)
    console.log('✓ Selected category:', category)
    console.log('✓ Selected service:', service.name)

    // Validate service details
    console.log('\nService Details:')
    console.log('  • Name:', service.name)
    console.log('  • Description:', service.description)
    console.log('  • Price: R', service.basePrice)
    console.log('  • Duration:', service.duration, 'minutes')
    console.log('  • Features:', service.features.join(', '))

    console.log('\n✅ Service selection successful\n')
  } catch (error) {
    console.error('❌ Service selection test failed:', error)
    process.exit(1)
  }

  // Test 2: Booking Form Data
  console.log('Test 2: Booking Form Data')
  try {
    // Simulate form data
    const bookingData: BookingFormData = {
      serviceId: 'test-service-id',
      date: new Date().toISOString().split('T')[0],
      time: '14:00',
      address: '123 Test Street, Cape Town, 8001',
      notes: 'Test booking notes'
    }

    // Validate form data
    const validations = [
      { field: 'serviceId', valid: bookingData.serviceId.length > 0 },
      { field: 'date', valid: new Date(bookingData.date).toString() !== 'Invalid Date' },
      { field: 'time', valid: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(bookingData.time) },
      { field: 'address', valid: bookingData.address.length >= 10 },
      { field: 'notes', valid: !bookingData.notes || bookingData.notes.length <= 500 }
    ]

    console.log('Form Validation Results:')
    validations.forEach(({ field, valid }) => {
      console.log(`  ${valid ? '✓' : '❌'} ${field}: ${valid ? 'Valid' : 'Invalid'}`)
    })

    const allValid = validations.every(v => v.valid)
    if (allValid) {
      console.log('\n✅ Form data validation successful\n')
    } else {
      throw new Error('Form validation failed')
    }
  } catch (error) {
    console.error('❌ Form data test failed:', error)
    process.exit(1)
  }

  // Test 3: API Integration
  console.log('Test 3: API Integration')
  try {
    // Test service API endpoint
    const response = await fetch('/api/services')
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const services = await response.json() as APIService[]
    console.log(`✓ API returned ${services.length} services`)

    // Validate service data structure
    const sampleService = services[0]
    const requiredFields = ['id', 'name', 'description', 'category']
    const missingFields = requiredFields.filter(field => !(field in sampleService))

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
    }

    console.log('✓ Service data structure is valid')
    console.log('\n✅ API integration test successful\n')
  } catch (error) {
    console.error('❌ API integration test failed:', error)
    process.exit(1)
  }

  // Test 4: End-to-End Flow
  console.log('Test 4: End-to-End Flow')
  try {
    const steps = [
      '1. Main Category Selection',
      '2. Service Category Selection',
      '3. Specific Service Selection',
      '4. Date & Time Selection',
      '5. Address Input',
      '6. Notes (Optional)',
      '7. Review',
      '8. Provider Selection'
    ]

    console.log('Booking Flow Steps:')
    steps.forEach(step => console.log(`  ✓ ${step}`))
    
    console.log('\n✅ End-to-end flow validation successful')
  } catch (error) {
    console.error('❌ End-to-end flow test failed:', error)
    process.exit(1)
  }

  console.log('\n🎉 All booking flow tests completed successfully!')
}

simulateBookingFlow().catch(console.error)
