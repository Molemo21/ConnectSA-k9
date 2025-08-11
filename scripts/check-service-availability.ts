import { db } from '../lib/db'

async function main() {
  console.log('🔍 Checking service availability in the database...\n')

  try {
    // Get all active services
    const services = await db.service.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    console.log(`📊 Found ${services.length} active services:\n`)

    let servicesWithProviders = 0
    let servicesWithoutProviders = 0
    let totalProviderRelationships = 0

    for (const service of services) {
      // Check if this service has any providers
      const providerCount = await db.providerService.count({
        where: { serviceId: service.id }
      })

      if (providerCount > 0) {
        servicesWithProviders++
        totalProviderRelationships += providerCount
        
        console.log(`✅ ${service.name} (${service.category})`)
        console.log(`   └─ ${providerCount} provider(s) offering this service`)
        
        // Get provider details
        const providerServices = await db.providerService.findMany({
          where: { serviceId: service.id },
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
            }
          }
        })
        
        for (const ps of providerServices) {
          const provider = ps.provider
          const user = provider.user
          const status = provider.status || 'UNKNOWN'
          const rate = ps.customRate || service.basePrice || 'N/A'
          
          console.log(`      • ${user?.name || 'Unknown'} (${status}) - $${rate}`)
        }
      } else {
        servicesWithoutProviders++
        console.log(`❌ ${service.name} (${service.category})`)
        console.log(`   └─ NO PROVIDERS OFFERING THIS SERVICE`)
      }
      console.log('')
    }

    // Summary
    console.log('📈 SUMMARY:')
    console.log(`   Total active services: ${services.length}`)
    console.log(`   Services with providers: ${servicesWithProviders}`)
    console.log(`   Services without providers: ${servicesWithoutProviders}`)
    console.log(`   Total provider-service relationships: ${totalProviderRelationships}`)
    console.log(`   Coverage rate: ${((servicesWithProviders / services.length) * 100).toFixed(1)}%`)

    if (servicesWithoutProviders > 0) {
      console.log('\n🚨 CRITICAL ISSUE:')
      console.log(`   ${servicesWithoutProviders} services have NO providers!`)
      console.log('   This means clients cannot book these services.')
      console.log('   The book-service page will show unavailable services.')
    } else {
      console.log('\n✅ All services have at least one provider!')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
