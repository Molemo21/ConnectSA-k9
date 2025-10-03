const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function deactivateOrphanedServices() {
  try {
    console.log('🔍 Finding services without providers...\n')

    // Get all active services without providers
    const orphanedServices = await prisma.service.findMany({
      where: { 
        isActive: true,
        providers: {
          none: {
            provider: {
              status: "APPROVED",
              available: true
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
      }
    })

    console.log(`📊 Found ${orphanedServices.length} orphaned services\n`)

    if (orphanedServices.length === 0) {
      console.log('✅ No orphaned services found!')
      return
    }

    console.log('🚨 ORPHANED SERVICES TO DEACTIVATE:')
    console.log('=' .repeat(50))
    orphanedServices.forEach((service, index) => {
      console.log(`${index + 1}. ${service.name}`)
      console.log(`   ID: ${service.id}`)
      console.log(`   Category: ${service.category}`)
      console.log(`   Description: ${service.description || 'No description'}`)
      console.log('')
    })

    // Deactivate orphaned services
    const updateResult = await prisma.service.updateMany({
      where: {
        id: {
          in: orphanedServices.map(service => service.id)
        }
      },
      data: {
        isActive: false
      }
    })

    console.log(`✅ Successfully deactivated ${updateResult.count} orphaned services`)
    console.log('\n📈 RESULT:')
    console.log('=' .repeat(50))
    console.log(`Services deactivated: ${updateResult.count}`)
    console.log('These services will no longer appear in the book-service page')
    console.log('They can be reactivated later when providers are added')

  } catch (error) {
    console.error('❌ Error deactivating orphaned services:', error)
  } finally {
    await prisma.$disconnect()
  }
}

deactivateOrphanedServices()
