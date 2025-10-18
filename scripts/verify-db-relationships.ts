const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function verifyDatabaseRelationships() {
  console.log('=== Starting Database Relationship Verification ===\n')

  try {
    // Check Booking-Client relationships
    console.log('Checking Booking-Client relationships...')
    const bookingsWithoutClients = await prisma.booking.count({
      where: {
        clientId: {
          equals: undefined
        }
      }
    })
    console.log(`Found ${bookingsWithoutClients} bookings without clients`)

    // Check Booking-Service relationships
    console.log('\nChecking Booking-Service relationships...')
    const bookingsWithoutServices = await prisma.booking.count({
      where: {
        serviceId: {
          equals: undefined
        }
      }
    })
    console.log(`Found ${bookingsWithoutServices} bookings without services`)

    // Check Booking-Provider relationships
    console.log('\nChecking Booking-Provider relationships...')
    const bookingsWithoutProviders = await prisma.booking.count({
      where: {
        providerId: {
          equals: undefined
        }
      }
    })
    console.log(`Found ${bookingsWithoutProviders} bookings without providers`)

    // Check Provider-Service relationships
    console.log('\nChecking Provider-Service relationships...')
    const providersWithoutServices = await prisma.provider.count({
      where: {
        services: {
          none: {}
        }
      }
    })
    console.log(`Found ${providersWithoutServices} providers without any services`)

    // Check Payment-Booking relationships
    console.log('\nChecking Payment-Booking relationships...')
    const paymentsWithoutBookings = await prisma.payment.count({
      where: {
        bookingId: {
          equals: undefined
        }
      }
    })
    console.log(`Found ${paymentsWithoutBookings} payments without bookings`)

    // Check Review-Booking relationships
    console.log('\nChecking Review-Booking relationships...')
    const reviewsWithoutBookings = await prisma.review.count({
      where: {
        bookingId: {
          equals: undefined
        }
      }
    })
    console.log(`Found ${reviewsWithoutBookings} reviews without bookings`)

    // Check for orphaned records
    console.log('\nChecking for orphaned records...')
    
    const orphanedPayments = await prisma.payment.findMany({
      where: {
        bookingId: {
          equals: undefined
        }
      },
      select: {
        id: true,
        amount: true,
        createdAt: true
      }
    })
    
    const orphanedReviews = await prisma.review.findMany({
      where: {
        bookingId: {
          equals: undefined
        }
      },
      select: {
        id: true,
        rating: true,
        createdAt: true
      }
    })

    // Check for bookings with missing relationships
    console.log('\nChecking for bookings with missing relationships...')
    const incompleteBookings = await prisma.booking.findMany({
      where: {
        OR: [
          { clientId: { equals: undefined } },
          { serviceId: { equals: undefined } },
          { providerId: { equals: undefined } }
        ]
      },
      select: {
        id: true,
        status: true,
        scheduledDate: true,
        clientId: true,
        serviceId: true,
        providerId: true
      }
    })

    if (incompleteBookings.length > 0) {
      console.log('\n⚠️ Found bookings with missing relationships:')
      console.table(incompleteBookings)
    }

    if (orphanedPayments.length > 0) {
      console.log('\n⚠️ Found orphaned payments:')
      console.table(orphanedPayments)
    }

    if (orphanedReviews.length > 0) {
      console.log('\n⚠️ Found orphaned reviews:')
      console.table(orphanedReviews)
    }

    // Summary
    console.log('\n=== Relationship Verification Summary ===')
    console.log('Issues found:')
    console.log(`- Bookings without clients: ${bookingsWithoutClients}`)
    console.log(`- Bookings without services: ${bookingsWithoutServices}`)
    console.log(`- Bookings without providers: ${bookingsWithoutProviders}`)
    console.log(`- Providers without services: ${providersWithoutServices}`)
    console.log(`- Orphaned payments: ${orphanedPayments.length}`)
    console.log(`- Orphaned reviews: ${reviewsWithoutBookings}`)
    console.log(`- Incomplete bookings: ${incompleteBookings.length}`)

    const hasIssues = bookingsWithoutClients > 0 ||
      bookingsWithoutServices > 0 ||
      bookingsWithoutProviders > 0 ||
      orphanedPayments.length > 0 ||
      orphanedReviews.length > 0 ||
      incompleteBookings.length > 0

    if (hasIssues) {
      console.log('\n⚠️ Database relationship issues found. Please review and fix.')
    } else {
      console.log('\n✅ All database relationships are valid!')
    }

  } catch (error) {
    console.error('\n❌ Error verifying database relationships:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the verification
verifyDatabaseRelationships()
  .catch(console.error)