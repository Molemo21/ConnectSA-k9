#!/usr/bin/env node
/**
 * Diagnose Provider Dashboard Issues
 * Check if provider exists, has bookings, and API is working
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function diagnose() {
  try {
    console.log('🔍 Diagnosing Provider Dashboard Issues...\n')

    // Get first provider user
    console.log('1️⃣ Checking for provider users...')
    const providerUsers = await prisma.user.findMany({
      where: { role: 'PROVIDER' },
      take: 5,
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true
      }
    })

    console.log(`   Found ${providerUsers.length} provider users`)
    if (providerUsers.length > 0) {
      console.table(providerUsers)
    } else {
      console.log('   ⚠️  No provider users found!')
      await prisma.$disconnect()
      return
    }

    // Check provider profiles
    console.log('\n2️⃣ Checking provider profiles...')
    for (const user of providerUsers) {
      const provider = await prisma.provider.findUnique({
        where: { userId: user.id },
        select: {
          id: true,
          businessName: true,
          status: true
        }
      })

      if (provider) {
        console.log(`   ✅ User ${user.email}: Provider profile exists`)
        console.log(`      - Provider ID: ${provider.id}`)
        console.log(`      - Business: ${provider.businessName || 'N/A'}`)
        console.log(`      - Status: ${provider.status}`)

        // Check bookings
        const bookings = await prisma.booking.findMany({
          where: { providerId: provider.id },
          select: {
            id: true,
            status: true,
            totalAmount: true,
            scheduledDate: true
          }
        })

        console.log(`      - Bookings: ${bookings.length}`)
        if (bookings.length > 0) {
          console.log(`      - Booking statuses:`)
          const statusCounts = bookings.reduce((acc, b) => {
            acc[b.status] = (acc[b.status] || 0) + 1
            return acc
          }, {})
          console.log('        ', statusCounts)
        } else {
          console.log('      ⚠️  No bookings found for this provider')
        }
      } else {
        console.log(`   ❌ User ${user.email}: No provider profile found!`)
      }
    }

    // Test the API query structure
    console.log('\n3️⃣ Testing API query structure...')
    const testProvider = await prisma.provider.findFirst({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    if (testProvider) {
      console.log(`   Testing with provider: ${testProvider.id}`)
      
      const testBookings = await prisma.booking.findMany({
        where: { providerId: testProvider.id },
        include: {
          service: {
            include: {
              category: true
            }
          },
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              phone: true
            }
          },
          payment: true,
          review: true
        },
        orderBy: {
          scheduledDate: 'desc'
        },
        take: 5
      })

      console.log(`   ✅ Query successful: Found ${testBookings.length} bookings`)
      
      if (testBookings.length > 0) {
        console.log('   Sample booking structure:')
        const sample = testBookings[0]
        console.log(`     - ID: ${sample.id}`)
        console.log(`     - Status: ${sample.status}`)
        console.log(`     - Service: ${sample.service?.name || 'N/A'}`)
        console.log(`     - Client: ${sample.client?.name || 'N/A'}`)
        console.log(`     - Amount: R${sample.totalAmount || 0}`)
        console.log(`     - Has Payment: ${!!sample.payment}`)
        console.log(`     - Has Review: ${!!sample.review}`)
      }
    } else {
      console.log('   ⚠️  No provider found to test with')
    }

    // Check for common issues
    console.log('\n4️⃣ Checking for common issues...')
    
    const providersWithoutBookings = await prisma.provider.findMany({
      where: {
        NOT: {
          bookings: {
            some: {}
          }
        }
      },
      select: {
        id: true,
        businessName: true,
        user: {
          select: {
            email: true
          }
        }
      }
    })

    if (providersWithoutBookings.length > 0) {
      console.log(`   ⚠️  Found ${providersWithoutBookings.length} providers with no bookings:`)
      providersWithoutBookings.forEach(p => {
        console.log(`      - ${p.user.email}: ${p.businessName || 'No business name'}`)
      })
      console.log('   This is normal if no clients have booked yet.')
    }

    console.log('\n✅ Diagnosis complete!\n')

  } catch (error) {
    console.error('❌ Error during diagnosis:', error)
  } finally {
    await prisma.$disconnect()
  }
}

diagnose()




