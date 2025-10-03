const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkOrphanedServices() {
  try {
    console.log('🔍 Checking for services without providers...\n')

    // Get all active services
    const allServices = await prisma.service.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        _count: {
          select: {
            providers: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    console.log(`📊 Total active services: ${allServices.length}\n`)

    // Find services without providers
    const orphanedServices = allServices.filter(service => service._count.providers === 0)
    
    console.log(`❌ Services without providers: ${orphanedServices.length}\n`)

    if (orphanedServices.length > 0) {
      console.log('🚨 ORPHANED SERVICES (no providers):')
      console.log('=' .repeat(50))
      orphanedServices.forEach((service, index) => {
        console.log(`${index + 1}. ${service.name}`)
        console.log(`   ID: ${service.id}`)
        console.log(`   Category: ${service.category}`)
        console.log(`   Description: ${service.description || 'No description'}`)
        console.log('')
      })
    }

    // Find services with providers
    const servicesWithProviders = allServices.filter(service => service._count.providers > 0)
    
    console.log(`✅ Services with providers: ${servicesWithProviders.length}\n`)

    if (servicesWithProviders.length > 0) {
      console.log('📋 SERVICES WITH PROVIDERS:')
      console.log('=' .repeat(50))
      servicesWithProviders.forEach((service, index) => {
        console.log(`${index + 1}. ${service.name} (${service._count.providers} providers)`)
        console.log(`   ID: ${service.id}`)
        console.log(`   Category: ${service.category}`)
        console.log('')
      })
    }

    // Get provider statistics
    const providerStats = await prisma.provider.findMany({
      where: { 
        status: 'APPROVED',
        available: true 
      },
      select: {
        id: true,
        businessName: true,
        _count: {
          select: {
            services: true
          }
        }
      }
    })

    console.log(`👥 Total approved providers: ${providerStats.length}\n`)

    const providersWithServices = providerStats.filter(provider => provider._count.services > 0)
    const providersWithoutServices = providerStats.filter(provider => provider._count.services === 0)

    console.log(`✅ Providers with services: ${providersWithServices.length}`)
    console.log(`❌ Providers without services: ${providersWithoutServices.length}\n`)

    if (providersWithoutServices.length > 0) {
      console.log('🚨 PROVIDERS WITHOUT SERVICES:')
      console.log('=' .repeat(50))
      providersWithoutServices.forEach((provider, index) => {
        console.log(`${index + 1}. ${provider.businessName || 'Unnamed Provider'}`)
        console.log(`   ID: ${provider.id}`)
        console.log('')
      })
    }

    // Summary
    console.log('📈 SUMMARY:')
    console.log('=' .repeat(50))
    console.log(`Total Services: ${allServices.length}`)
    console.log(`Services with Providers: ${servicesWithProviders.length}`)
    console.log(`Orphaned Services: ${orphanedServices.length}`)
    console.log(`Total Providers: ${providerStats.length}`)
    console.log(`Providers with Services: ${providersWithServices.length}`)
    console.log(`Providers without Services: ${providersWithoutServices.length}`)

    if (orphanedServices.length > 0) {
      console.log('\n🚨 ISSUE FOUND: There are services without providers!')
      console.log('   This means clients can see services they cannot book.')
      console.log('   Recommendation: Either add providers to these services or deactivate them.')
    } else {
      console.log('\n✅ All services have at least one provider!')
    }

  } catch (error) {
    console.error('❌ Error checking services:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkOrphanedServices()
