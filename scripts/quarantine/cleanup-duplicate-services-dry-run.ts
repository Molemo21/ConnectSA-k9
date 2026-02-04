import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ServiceWithProviders {
  id: string
  name: string
  category: string
  description: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  providers: Array<{
    id: string
    providerId: string
    serviceId: string
    customRate: number | null
  }>
  _count: {
    providers: number
    bookings: number
  }
}

interface ServiceGroup {
  name: string
  category: string
  services: ServiceWithProviders[]
}

interface CleanupPlan {
  serviceName: string
  category: string
  keepService: ServiceWithProviders
  deleteServices: ServiceWithProviders[]
  providersToMigrate: number
  bookingsToMigrate: number
}

async function main() {
  console.log('🔍 DRY RUN: Analyzing duplicate services cleanup plan...\n')

  try {
    // Step 1: Get all services with their provider relationships and usage counts
    console.log('📊 Analyzing current services...')
    const allServices = await prisma.service.findMany({
      include: {
        providers: true,
        _count: {
          select: {
            providers: true,
            bookings: true
          }
        }
      },
      orderBy: [
        { name: 'asc' },
        { category: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    console.log(`Found ${allServices.length} total services`)

    // Step 2: Group services by name and category to identify duplicates
    const serviceGroups = new Map<string, ServiceGroup>()
    
    for (const service of allServices) {
      const key = `${service.name.toLowerCase().trim()}|${service.category.toLowerCase().trim()}`
      
      if (!serviceGroups.has(key)) {
        serviceGroups.set(key, {
          name: service.name,
          category: service.category,
          services: []
        })
      }
      
      serviceGroups.get(key)!.services.push(service)
    }

    // Step 3: Identify duplicates and plan cleanup
    const duplicates: ServiceGroup[] = []
    const uniqueServices: ServiceGroup[] = []
    
    for (const [key, group] of serviceGroups) {
      if (group.services.length > 1) {
        duplicates.push(group)
      } else {
        uniqueServices.push(group)
      }
    }

    console.log(`\n📈 Analysis Results:`)
    console.log(`   Unique services: ${uniqueServices.length}`)
    console.log(`   Services with duplicates: ${duplicates.length}`)
    console.log(`   Total duplicate entries: ${duplicates.reduce((sum, group) => sum + group.services.length - 1, 0)}`)

    if (duplicates.length === 0) {
      console.log('\n✅ No duplicate services found! Database is clean.')
      return
    }

    // Step 4: Display duplicate groups for review
    console.log('\n🔍 Duplicate Services Found:')
    for (const group of duplicates) {
      console.log(`\n   ${group.name} (${group.category}):`)
      for (const service of group.services) {
        const providerCount = service._count.providers
        const bookingCount = service._count.bookings
        const hasProviders = providerCount > 0
        const hasBookings = bookingCount > 0
        
        console.log(`     • ID: ${service.id}`)
        console.log(`       Created: ${service.createdAt.toISOString().split('T')[0]}`)
        console.log(`       Providers: ${providerCount}, Bookings: ${bookingCount}`)
        console.log(`       Status: ${hasProviders ? '🟢' : '🔴'} Has providers, ${hasBookings ? '🟢' : '🔴'} Has bookings`)
      }
    }

    // Step 5: Create cleanup plan
    console.log('\n📋 Cleanup Plan (DRY RUN - No changes will be made):')
    
    const cleanupPlan: CleanupPlan[] = []
    let totalServicesToDelete = 0
    let totalProvidersToMigrate = 0
    let totalBookingsToMigrate = 0
    
    for (const group of duplicates) {
      // Sort services by priority: most providers first, then most bookings, then oldest
      const sortedServices = group.services.sort((a, b) => {
        if (a._count.providers !== b._count.providers) {
          return b._count.providers - a._count.providers
        }
        if (a._count.bookings !== b._count.bookings) {
          return b._count.bookings - a._count.bookings
        }
        return a.createdAt.getTime() - b.createdAt.getTime()
      })
      
      const keepService = sortedServices[0]
      const deleteServices = sortedServices.slice(1)
      
      const providersToMigrate = deleteServices.reduce((sum, service) => sum + service._count.providers, 0)
      const bookingsToMigrate = deleteServices.reduce((sum, service) => sum + service._count.bookings, 0)
      
      cleanupPlan.push({
        serviceName: group.name,
        category: group.category,
        keepService,
        deleteServices,
        providersToMigrate,
        bookingsToMigrate
      })
      
      totalServicesToDelete += deleteServices.length
      totalProvidersToMigrate += providersToMigrate
      totalBookingsToMigrate += bookingsToMigrate
    }

    // Display detailed cleanup plan
    for (const plan of cleanupPlan) {
      console.log(`\n   📝 ${plan.serviceName} (${plan.category}):`)
      console.log(`      Keep: ${plan.keepService.id}`)
      console.log(`        - Providers: ${plan.keepService._count.providers}`)
      console.log(`        - Bookings: ${plan.keepService._count.bookings}`)
      console.log(`        - Created: ${plan.keepService.createdAt.toISOString().split('T')[0]}`)
      
      console.log(`      Delete: ${plan.deleteServices.length} duplicate(s)`)
      for (const deleteService of plan.deleteServices) {
        console.log(`        • ${deleteService.id} (${deleteService._count.providers} providers, ${deleteService._count.bookings} bookings)`)
      }
      
      if (plan.providersToMigrate > 0) {
        console.log(`      Providers to migrate: ${plan.providersToMigrate}`)
      }
      if (plan.bookingsToMigrate > 0) {
        console.log(`      Bookings to migrate: ${plan.bookingsToMigrate}`)
      }
    }

    // Summary
    console.log('\n📊 Cleanup Summary:')
    console.log(`   Services to keep: ${uniqueServices.length + duplicates.length}`)
    console.log(`   Services to delete: ${totalServicesToDelete}`)
    console.log(`   Providers to migrate: ${totalProvidersToMigrate}`)
    console.log(`   Bookings to migrate: ${totalBookingsToMigrate}`)
    console.log(`   Final service count: ${uniqueServices.length + duplicates.length}`)

    // Safety recommendations
    console.log('\n⚠️  Safety Recommendations:')
    console.log('   1. Backup your database before running the actual cleanup')
    console.log('   2. Test on a staging environment first')
    console.log('   3. Run during low-traffic hours')
    console.log('   4. Monitor the application after cleanup')
    
    console.log('\n🚀 To execute the actual cleanup, run:')
    console.log('   npx tsx scripts/cleanup-duplicate-services.ts')

  } catch (error) {
    console.error('\n❌ Error during analysis:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('\n❌ Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
