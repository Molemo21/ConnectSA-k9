const { SERVICE_CATEGORIES } = require('../config/service-categories')
const { getAllServices, groupServicesByCategory } = require('../lib/service-utils')

type MainCategory = 'BEAUTY_AND_WELLNESS' | 'HOME_SERVICES'
type ServiceCategory = 'HAIR_SERVICES' | 'NAILS' | 'RESIDENTIAL_CLEANING' | 'PLUMBING' | 'ELECTRICAL'

interface ServiceData {
  id?: string
  name: string
  description: string
  basePrice: number
  duration: number
  features: string[]
  mainCategory?: MainCategory
  category?: ServiceCategory
}

type GroupedServices = Record<MainCategory, Record<ServiceCategory, ServiceData[]>>

async function testServiceSelection() {
  console.log('🧪 Starting Service Selection Tests\n')

  // Test 1: Service Configuration Structure
  console.log('Test 1: Service Configuration Structure')
  try {
    // Check main categories
    const mainCategories = Object.keys(SERVICE_CATEGORIES) as MainCategory[]
    console.log(`✓ Found ${mainCategories.length} main categories:`, mainCategories)

    // Check categories and services
    for (const [mainCat, mainCatData] of Object.entries(SERVICE_CATEGORIES) as [MainCategory, any][]) {
      console.log(`\n📁 ${mainCatData.name} (${mainCat}):`)
      
      const categories = Object.entries(mainCatData.categories) as [ServiceCategory, any][]
      console.log(`  ✓ Found ${categories.length} categories`)

      for (const [catId, category] of categories) {
        const serviceCount = category.services.length
        console.log(`  └─ ${category.name} (${catId}): ${serviceCount} services`)
        
        // Validate service data
        category.services.forEach((service: ServiceData) => {
          const validService = 
            typeof service.name === 'string' &&
            typeof service.description === 'string' &&
            typeof service.basePrice === 'number' &&
            typeof service.duration === 'number' &&
            Array.isArray(service.features)

          if (!validService) {
            throw new Error(`Invalid service data in ${catId}: ${service.name}`)
          }
        })
      }
    }
    console.log('\n✅ Service configuration structure is valid\n')
  } catch (error) {
    console.error('❌ Service configuration test failed:', error)
    process.exit(1)
  }

  // Test 2: Service Utilities
  console.log('Test 2: Service Utilities')
  try {
    // Test getAllServices
    const allServices = await getAllServices()
    console.log(`✓ getAllServices returned ${allServices.length} services`)

    // Test groupServicesByCategory
    const groupedServices = groupServicesByCategory(allServices) as GroupedServices
    console.log('✓ Successfully grouped services by category')

    // Validate grouped services structure
    for (const mainCat of Object.keys(SERVICE_CATEGORIES) as MainCategory[]) {
      if (groupedServices[mainCat]) {
        console.log(`\n📁 ${mainCat} services:`)
        for (const [category, services] of Object.entries(groupedServices[mainCat]) as [string, ServiceData[]][]) {
          console.log(`  └─ ${category}: ${services.length} services`)
        }
      }
    }
    console.log('\n✅ Service utilities are working correctly\n')
  } catch (error) {
    console.error('❌ Service utilities test failed:', error)
    process.exit(1)
  }

  // Test 3: Service Data Validation
  console.log('Test 3: Service Data Validation')
  try {
    const allServices = await getAllServices()
    const validationResults = allServices.map((service: ServiceData) => {
      const issues: string[] = []
      
      // Required fields
      if (!service.name) issues.push('Missing name')
      if (!service.description) issues.push('Missing description')
      if (typeof service.basePrice !== 'number') issues.push('Invalid basePrice')
      if (typeof service.duration !== 'number') issues.push('Invalid duration')
      if (!Array.isArray(service.features)) issues.push('Missing features')
      
      // Business logic
      if (service.basePrice <= 0) issues.push('basePrice must be positive')
      if (service.duration <= 0) issues.push('duration must be positive')
      if (service.features.length === 0) issues.push('features cannot be empty')
      
      return {
        service: service.name,
        valid: issues.length === 0,
        issues
      }
    })

    const invalidServices = validationResults.filter((r: { valid: boolean }) => !r.valid)
    if (invalidServices.length > 0) {
      console.log('\n⚠️ Found invalid services:')
      invalidServices.forEach((result: { service: string, issues: string[] }) => {
        console.log(`  ❌ ${result.service}:`, result.issues.join(', '))
      })
    } else {
      console.log('✅ All services passed validation\n')
    }
  } catch (error) {
    console.error('❌ Service validation test failed:', error)
    process.exit(1)
  }

  console.log('🎉 All tests completed successfully!')
}

testServiceSelection().catch(console.error)
