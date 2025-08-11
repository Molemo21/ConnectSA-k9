import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking services and providers in the database...\n')

  try {
    // Get all active services
    const services = await prisma.service.findMany({
      where: { isActive: true },
      include: {
        providers: {
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
        }
      },
      orderBy: { name: 'asc' }
    })

    console.log(`📊 Found ${services.length} active services:\n`)

    let totalProviders = 0
    let servicesWithProviders = 0
    let servicesWithoutProviders = 0

    for (const service of services) {
      const providerCount = service.providers.length
      totalProviders += providerCount
      
      if (providerCount > 0) {
        servicesWithProviders++
        console.log(`✅ ${service.name} (${service.category})`)
        console.log(`   └─ ${providerCount} provider(s) offering this service:`)
        
        for (const ps of service.providers) {
          const provider = ps.provider
          const user = provider.user
          const status = provider.status || 'UNKNOWN'
          const rate = ps.customRate || service.basePrice || 'N/A'
          
          console.log(`      • ${user?.name || 'Unknown'} (${user?.email || 'No email'})`)
          console.log(`        Status: ${status}, Rate: $${rate}`)
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
    console.log(`   Total provider-service relationships: ${totalProviders}`)

    if (servicesWithoutProviders > 0) {
      console.log('\n⚠️  WARNING: Some services have no providers!')
      console.log('   This means clients cannot book these services.')
    } else {
      console.log('\n✅ All services have at least one provider!')
    }

    // Check provider status distribution
    console.log('\n👥 Provider Status Distribution:')
    const providerStatuses = await prisma.provider.groupBy({
      by: ['status'],
      _count: { status: true }
    })
    
    for (const status of providerStatuses) {
      console.log(`   ${status.status || 'NO_STATUS'}: ${status._count.status}`)
    }

  } catch (error) {
    console.error('❌ Error checking services and providers:', error)
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
