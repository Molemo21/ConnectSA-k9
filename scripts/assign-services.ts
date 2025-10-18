interface AssignmentResult {
  provider: string
  success?: boolean
  servicesAssigned?: number
  services?: string[]
  error?: string
}

interface ApiResponse {
  success: boolean
  results?: AssignmentResult[]
  message?: string
  error?: string
  remainingProvidersWithoutServices?: number
}

async function assignServices() {
  try {
    console.log('=== Assigning Services to Providers ===\n')

    const response = await fetch('http://localhost:3000/api/admin/assign-services', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json() as ApiResponse

    if (data.success) {
      console.log('✅ Service assignment successful!\n')
      
      if (data.results) {
        console.log('Results:')
        data.results.forEach((result) => {
          if (result.success) {
            console.log(`\n✅ Provider: ${result.provider}`)
            console.log(`   Assigned ${result.servicesAssigned} services:`)
            result.services?.forEach((service) => {
              console.log(`   - ${service}`)
            })
          } else {
            console.log(`\n❌ Provider: ${result.provider}`)
            console.log(`   Error: ${result.error}`)
          }
        })
      }

      console.log(`\n${data.message}`)
    } else {
      console.error('❌ Service assignment failed:', data.error)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

assignServices()