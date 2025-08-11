import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Fixing Haircut duplicate issue...\n')

  try {
    // Step 1: Get the two haircut services
    const haircutServices = await prisma.service.findMany({
      where: {
        name: {
          contains: 'haircut',
          mode: 'insensitive'
        }
      },
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
        },
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

    if (haircutServices.length !== 2) {
      console.log(`❌ Expected 2 haircut services, found ${haircutServices.length}`)
      return
    }

    const [service1, service2] = haircutServices

    console.log('📊 Found 2 Haircut services:')
    console.log(`\n   Service 1:`)
    console.log(`     ID: ${service1.id}`)
    console.log(`     Name: "${service1.name}"`)
    console.log(`     Description: "${service1.description}"`)
    console.log(`     Created: ${service1.createdAt.toISOString().split('T')[0]}`)
    console.log(`     Providers: ${service1._count.providers}`)
    console.log(`     Bookings: ${service1._count.bookings}`)

    console.log(`\n   Service 2:`)
    console.log(`     ID: ${service2.id}`)
    console.log(`     Name: "${service2.name}"`)
    console.log(`     Description: "${service2.description}"`)
    console.log(`     Created: ${service2.createdAt.toISOString().split('T')[0]}`)
    console.log(`     Providers: ${service2._count.providers}`)
    console.log(`     Bookings: ${service2._count.bookings}`)

    // Step 2: Determine which service to keep
    // Priority: most providers > most bookings > oldest creation date
    let keepService, deleteService
    
    if (service1._count.providers > service2._count.providers) {
      keepService = service1
      deleteService = service2
    } else if (service2._count.providers > service1._count.providers) {
      keepService = service2
      deleteService = service1
    } else if (service1._count.bookings > service2._count.bookings) {
      keepService = service1
      deleteService = service2
    } else if (service2._count.bookings > service1._count.bookings) {
      keepService = service2
      deleteService = service1
    } else {
      // If tied, keep the older one
      keepService = service1.createdAt < service2.createdAt ? service1 : service2
      deleteService = service1.createdAt < service2.createdAt ? service2 : service1
    }

    console.log(`\n🎯 Decision:`)
    console.log(`   KEEP: ${keepService.id} (${keepService._count.providers} providers, ${keepService._count.bookings} bookings)`)
    console.log(`   DELETE: ${deleteService.id} (${deleteService._count.providers} providers, ${deleteService._count.bookings} bookings)`)

    // Step 3: Check if this is a dry run
    const isDryRun = process.argv.includes('--dry-run')
    
    if (isDryRun) {
      console.log('\n🔍 DRY RUN MODE - No changes will be made')
      console.log('\n📋 Summary of what would happen:')
      console.log(`   1. Keep service: ${keepService.id}`)
      console.log(`   2. Delete service: ${deleteService.id}`)
      
      if (deleteService._count.providers > 0) {
        console.log(`   3. Migrate ${deleteService._count.providers} providers to kept service`)
      }
      
      if (deleteService._count.bookings > 0) {
        console.log(`   4. Migrate ${deleteService._count.bookings} bookings to kept service`)
      }
      
      console.log('\n🚀 To execute the actual fix, run:')
      console.log('   npx tsx scripts/fix-haircut-duplicate.ts')
      return
    }

    // Step 4: Execute the fix
    console.log('\n🚀 Executing fix...')

    // Migrate providers if needed
    if (deleteService._count.providers > 0) {
      console.log(`   Migrating ${deleteService._count.providers} providers...`)
      
      await prisma.providerService.updateMany({
        where: { serviceId: deleteService.id },
        data: { serviceId: keepService.id }
      })
      
      console.log(`   ✅ Providers migrated successfully`)
    }

    // Migrate bookings if needed
    if (deleteService._count.bookings > 0) {
      console.log(`   Migrating ${deleteService._count.bookings} bookings...`)
      
      await prisma.booking.updateMany({
        where: { serviceId: deleteService.id },
        data: { serviceId: keepService.id }
      })
      
      console.log(`   ✅ Bookings migrated successfully`)
    }

    // Delete the duplicate service
    console.log(`   Deleting duplicate service: ${deleteService.id}`)
    
    await prisma.service.delete({
      where: { id: deleteService.id }
    })
    
    console.log(`   ✅ Duplicate service deleted successfully`)

    // Step 5: Verify the fix
    console.log('\n🔍 Verifying fix...')
    
    const remainingHaircutServices = await prisma.service.findMany({
      where: {
        name: {
          contains: 'haircut',
          mode: 'insensitive'
        }
      },
      include: {
        _count: {
          select: {
            providers: true,
            bookings: true
          }
        }
      }
    })

    console.log(`\n📊 Remaining haircut services: ${remainingHaircutServices.length}`)
    
    if (remainingHaircutServices.length === 1) {
      const remaining = remainingHaircutServices[0]
      console.log(`\n✅ SUCCESS! Only one haircut service remains:`)
      console.log(`   ID: ${remaining.id}`)
      console.log(`   Name: "${remaining.name}"`)
      console.log(`   Category: "${remaining.category}"`)
      console.log(`   Providers: ${remaining._count.providers}`)
      console.log(`   Bookings: ${remaining._count.bookings}`)
    } else {
      console.log(`\n❌ ERROR: Expected 1 haircut service, found ${remainingHaircutServices.length}`)
    }

    console.log('\n🎉 Haircut duplicate fix complete!')

  } catch (error) {
    console.error('\n❌ Error during fix:', error)
    throw error
  }
}

// Safety check - require confirmation for production
if (process.env.NODE_ENV === 'production' && !process.argv.includes('--dry-run')) {
  console.log('⚠️  WARNING: Running in production mode!')
  console.log('   Please ensure you have a backup before proceeding.')
  console.log('   Add --dry-run flag to see what would change without making changes.')
  
  if (!process.argv.includes('--force')) {
    console.log('\n❌ Fix aborted. Use --force to proceed in production.')
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
