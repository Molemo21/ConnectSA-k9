#!/usr/bin/env node

/**
 * Test Script: Check Booking Data in Database
 * 
 * This script tests if there are bookings in the database
 * and if the admin booking API is working correctly.
 */

const { PrismaClient } = require('@prisma/client')

async function testBookingData() {
  console.log('🔍 Testing Booking Data in Database...\n')

  const prisma = new PrismaClient()

  try {
    // Test 1: Check total booking count
    console.log('1️⃣ Checking total booking count...')
    const totalBookings = await prisma.booking.count()
    console.log(`📊 Total bookings in database: ${totalBookings}`)

    if (totalBookings === 0) {
      console.log('❌ No bookings found in database!')
      console.log('💡 This explains why the admin dashboard shows 0 bookings.')
      return
    }

    // Test 2: Check booking structure
    console.log('\n2️⃣ Checking booking structure...')
    const sampleBooking = await prisma.booking.findFirst({
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        provider: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        service: {
          select: {
            name: true
          }
        },
        review: {
          select: {
            rating: true,
            comment: true
          }
        }
      }
    })

    if (sampleBooking) {
      console.log('✅ Sample booking found:')
      console.log(`   ID: ${sampleBooking.id}`)
      console.log(`   Client: ${sampleBooking.client?.name || 'N/A'}`)
      console.log(`   Provider: ${sampleBooking.provider?.user?.name || 'N/A'}`)
      console.log(`   Service: ${sampleBooking.service?.name || 'N/A'}`)
      console.log(`   Status: ${sampleBooking.status}`)
      console.log(`   Amount: ${sampleBooking.totalAmount}`)
    } else {
      console.log('❌ No sample booking found')
    }

    // Test 3: Check for missing relations
    console.log('\n3️⃣ Checking for missing relations...')
    const bookingsWithMissingClient = await prisma.booking.count({
      where: {
        client: null
      }
    })
    
    const bookingsWithMissingProvider = await prisma.booking.count({
      where: {
        provider: null
      }
    })
    
    const bookingsWithMissingService = await prisma.booking.count({
      where: {
        service: null
      }
    })

    console.log(`📊 Bookings with missing client: ${bookingsWithMissingClient}`)
    console.log(`📊 Bookings with missing provider: ${bookingsWithMissingProvider}`)
    console.log(`📊 Bookings with missing service: ${bookingsWithMissingService}`)

    if (bookingsWithMissingClient > 0 || bookingsWithMissingProvider > 0 || bookingsWithMissingService > 0) {
      console.log('⚠️  Some bookings have missing relations - this could cause API issues')
    }

    // Test 4: Check booking statuses
    console.log('\n4️⃣ Checking booking statuses...')
    const statusCounts = await prisma.booking.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })

    console.log('📊 Booking status distribution:')
    statusCounts.forEach(status => {
      console.log(`   ${status.status}: ${status._count.status}`)
    })

  } catch (error) {
    console.error('❌ Error testing booking data:', error)
  } finally {
    await prisma.$disconnect()
  }

  console.log('\n🎯 Test Complete!')
  console.log('\n💡 If bookings exist but admin dashboard shows 0:')
  console.log('   - Check API endpoint response format')
  console.log('   - Check component data mapping')
  console.log('   - Check authentication/authorization')
  console.log('\n💡 If no bookings exist:')
  console.log('   - Create test bookings in the database')
  console.log('   - Check booking creation process')
}

// Run the test
testBookingData()
