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

async function main() {
  console.log('🧹 Starting duplicate services cleanup...\n')

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

    // Step 5: Interactive cleanup decision
    console.log('\n⚠️  Cleanup Strategy:')
    console.log('   For each duplicate group, we will:')
    console.log('   1. Keep the service with the most providers/bookings')
    console.log('   2. Migrate any orphaned providers to the kept service')
    console.log('   3. Delete duplicate services')
    console.log('   4. Update any existing bookings to reference the kept service')

    // Step 6: Execute cleanup
    console.log('\n🚀 Executing cleanup...')
    
    let totalMerged = 0
    let totalDeleted = 0
    
    for (const group of duplicates) {
      console.log(`\n   Processing: ${group.name} (${group.category})`)
      
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
      
      console.log(`     Keeping: ${keepService.id} (${keepService._count.providers} providers, ${keepService._count.bookings} bookings)`)
      
      // Migrate providers from services to be deleted
      for (const deleteService of deleteServices) {
        if (deleteService._count.providers > 0) {
          console.log(`     Migrating ${deleteService._count.providers} providers from ${deleteService.id}...`)
          
          await prisma.providerService.updateMany({
            where: { serviceId: deleteService.id },
            data: { serviceId: keepService.id }
          })
          
          totalMerged += deleteService._count.providers
        }
        
        if (deleteService._count.bookings > 0) {
          console.log(`     Migrating ${deleteService._count.bookings} bookings from ${deleteService.id}...`)
          
          await prisma.booking.updateMany({
            where: { serviceId: deleteService.id },
            data: { serviceId: keepService.id }
          })
        }
        
        // Delete the duplicate service
        await prisma.service.delete({
          where: { id: deleteService.id }
        })
        
        totalDeleted++
        console.log(`     Deleted: ${deleteService.id}`)
      }
    }

    // Step 7: Verify cleanup results
    console.log('\n🔍 Verifying cleanup results...')
    const finalServices = await prisma.service.findMany({
      include: {
        _count: {
          select: {
            providers: true,
            bookings: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    console.log(`\n✅ Cleanup Complete!`)
    console.log(`   Services merged: ${totalMerged}`)
    console.log(`   Duplicate services deleted: ${totalDeleted}`)
    console.log(`   Final service count: ${finalServices.length}`)
    
    // Display final service list
    console.log('\n📋 Final Service Catalog:')
    for (const service of finalServices) {
      console.log(`   • ${service.name} (${service.category})`)
      console.log(`     Providers: ${service._count.providers}, Bookings: ${service._count.bookings}`)
    }

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error)
    throw error
  }
}

// Safety check - require confirmation for production
if (process.env.NODE_ENV === 'production') {
  console.log('⚠️  WARNING: Running in production mode!')
  console.log('   Please ensure you have a backup before proceeding.')
  console.log('   Add --force flag to bypass this check.')
  
  if (!process.argv.includes('--force')) {
    console.log('\n❌ Cleanup aborted. Use --force to proceed in production.')
    process.exit(1)
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
