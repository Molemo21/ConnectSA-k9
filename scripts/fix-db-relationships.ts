const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

interface Provider {
  id: string
  user?: {
    name: string | null
  } | null
}

async function fixDatabaseRelationships() {
  console.log('=== Starting Database Relationship Fixes ===\n')

  try {
    // Get all bookings with missing relationships
    const brokenBookings = await prisma.booking.findMany({
      where: {
        OR: [
          { clientId: { equals: undefined } },
          { serviceId: { equals: undefined } },
          { providerId: { equals: undefined } }
        ]
      }
    })

    console.log(`Found ${brokenBookings.length} bookings with missing relationships`)

    // Delete broken bookings as they can't be repaired without the required relationships
    if (brokenBookings.length > 0) {
      console.log('\nDeleting broken bookings...')
      const deleteResult = await prisma.booking.deleteMany({
        where: {
          OR: [
            { clientId: { equals: undefined } },
            { serviceId: { equals: undefined } },
            { providerId: { equals: undefined } }
          ]
        }
      })
      console.log(`Deleted ${deleteResult.count} broken bookings`)
    }

    // Get providers without services
    const providersWithoutServices = await prisma.provider.findMany({
      where: {
        services: {
          none: {}
        }
      },
      include: {
        user: true
      }
    })

    console.log(`\nFound ${providersWithoutServices.length} providers without services`)

    if (providersWithoutServices.length > 0) {
      console.log('\nProviders without services:')
      providersWithoutServices.forEach((provider: Provider) => {
        console.log(`- Provider ${provider.id} (${provider.user?.name || 'Unknown'})`)
      })
      console.log('\nPlease assign services to these providers manually.')
    }

    // Verify the fixes
    console.log('\nVerifying fixes...')
    
    const remainingBrokenBookings = await prisma.booking.count({
      where: {
        OR: [
          { clientId: { equals: undefined } },
          { serviceId: { equals: undefined } },
          { providerId: { equals: undefined } }
        ]
      }
    })

    if (remainingBrokenBookings === 0) {
      console.log('✅ All broken bookings have been fixed')
    } else {
      console.log(`⚠️ There are still ${remainingBrokenBookings} broken bookings`)
    }

    const remainingProvidersWithoutServices = await prisma.provider.count({
      where: {
        services: {
          none: {}
        }
      }
    })

    if (remainingProvidersWithoutServices === 0) {
      console.log('✅ All providers have services assigned')
    } else {
      console.log(`⚠️ There are still ${remainingProvidersWithoutServices} providers without services`)
    }

    console.log('\n=== Database Relationship Fixes Complete ===')

  } catch (error) {
    console.error('\n❌ Error fixing database relationships:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the fixes
fixDatabaseRelationships()
  .catch(console.error)