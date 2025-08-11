import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 COMPREHENSIVE SERVICE COVERAGE ANALYSIS\n')
  console.log('=' .repeat(60))

  try {
    // 1. Get all active services
    const allServices = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    console.log(`📊 TOTAL ACTIVE SERVICES: ${allServices.length}\n`)

    // 2. Get all provider-service relationships
    const providerServices = await prisma.providerService.findMany({
      include: {
        provider: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        service: true
      }
    })

    // 3. Group services by category
    const servicesByCategory = allServices.reduce((acc, service) => {
      if (!acc[service.category]) {
        acc[service.category] = []
      }
      acc[service.category].push(service)
      return acc
    }, {} as Record<string, typeof allServices>)

    // 4. Analyze each category
    let totalServicesWithProviders = 0
    let totalServicesWithoutProviders = 0
    let totalProviderRelationships = 0

    for (const [category, services] of Object.entries(servicesByCategory)) {
      console.log(`🏷️  CATEGORY: ${category}`)
      console.log(`   Services in category: ${services.length}`)
      
      let categoryServicesWithProviders = 0
      let categoryServicesWithoutProviders = 0
      
      for (const service of services) {
        const serviceProviders = providerServices.filter(ps => ps.serviceId === service.id)
        
        if (serviceProviders.length > 0) {
          categoryServicesWithProviders++
          totalServicesWithProviders++
          totalProviderRelationships += serviceProviders.length
          
          console.log(`   ✅ ${service.name}`)
          console.log(`      └─ ${serviceProviders.length} provider(s)`)
          
          // Show provider details
          for (const ps of serviceProviders) {
            const provider = ps.provider
            const user = provider.user
            const status = provider.status || 'UNKNOWN'
            const rate = ps.customRate || service.basePrice || 'N/A'
            
            console.log(`         • ${user?.name || 'Unknown'} (${status}) - $${rate}`)
          }
        } else {
          categoryServicesWithoutProviders++
          totalServicesWithoutProviders++
          console.log(`   ❌ ${service.name} - NO PROVIDERS`)
        }
      }
      
      console.log(`   Summary: ${categoryServicesWithProviders}/${services.length} services have providers\n`)
    }

    // 5. Overall Summary
    console.log('📈 OVERALL SUMMARY')
    console.log('=' .repeat(40))
    console.log(`Total Active Services: ${allServices.length}`)
    console.log(`Services with Providers: ${totalServicesWithProviders}`)
    console.log(`Services without Providers: ${totalServicesWithoutProviders}`)
    console.log(`Total Provider-Service Relationships: ${totalProviderRelationships}`)
    console.log(`Coverage Rate: ${((totalServicesWithProviders / allServices.length) * 100).toFixed(1)}%`)

    // 6. Critical Issues
    console.log('\n🚨 CRITICAL ISSUES IDENTIFIED:')
    if (totalServicesWithoutProviders > 0) {
      console.log(`❌ ${totalServicesWithoutProviders} services have NO providers`)
      console.log('   → Clients cannot book these services')
      console.log('   → This will cause booking failures')
      
      // List services without providers
      const servicesWithoutProviders = allServices.filter(service => {
        return !providerServices.some(ps => ps.serviceId === service.id)
      })
      
      console.log('\n   Services without providers:')
      for (const service of servicesWithoutProviders) {
        console.log(`   • ${service.name} (${service.category})`)
      }
    }

    // 7. Provider Status Analysis
    console.log('\n👥 PROVIDER STATUS ANALYSIS:')
    const providerStatuses = await prisma.provider.groupBy({
      by: ['status'],
      _count: { status: true }
    })
    
    for (const status of providerStatuses) {
      const count = status._count.status
      const percentage = ((count / providerStatuses.reduce((sum, s) => sum + s._count.status, 0)) * 100).toFixed(1)
      console.log(`   ${status.status || 'NO_STATUS'}: ${count} (${percentage}%)`)
    }

    // 8. Recommendations
    console.log('\n💡 RECOMMENDATIONS:')
    if (totalServicesWithoutProviders > 0) {
      console.log('1. IMMEDIATE ACTION REQUIRED:')
      console.log('   • Remove or deactivate services without providers')
      console.log('   • Or recruit providers for these services')
      console.log('   • Update the book-service page to only show available services')
      
      console.log('\n2. CODE CHANGES NEEDED:')
      console.log('   • Modify /api/services to only return services with providers')
      console.log('   • Add validation in booking flow to prevent booking unavailable services')
      console.log('   • Update UI to show service availability status')
    } else {
      console.log('✅ All services have providers - no immediate action needed')
    }

    console.log('\n3. MONITORING:')
    console.log('   • Set up alerts for services with 0 providers')
    console.log('   • Regular checks of provider-service coverage')
    console.log('   • Provider onboarding process to ensure service coverage')

  } catch (error) {
    console.error('❌ Error during analysis:', error)
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
