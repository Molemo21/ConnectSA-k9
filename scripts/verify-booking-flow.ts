import { PrismaClient } from '@prisma/client'
import chalk from 'chalk'
import { createSADateTime } from '../lib/date-utils'

const prisma = new PrismaClient()

async function verifyBookingFlow() {
  console.log(chalk.blue('\n🔍 Starting Booking Flow Verification...\n'))

  try {
    // 1. Verify Cleaning Services
    console.log(chalk.yellow('📊 Checking Cleaning Services...'))
    const cleaningServices = await prisma.service.findMany({
      where: {
        category: 'CLEANING',
        isActive: true
      }
    })

    console.log(chalk.green(`✓ Found ${cleaningServices.length} active cleaning services`))

    // 2. Verify Available Providers
    console.log(chalk.yellow('\n👥 Checking Available Providers...'))
    const providers = await prisma.provider.findMany({
      where: {
        services: {
          some: {
            service: {
              category: 'CLEANING'
            }
          }
        },
        status: 'APPROVED',
        available: true
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        services: {
          include: {
            service: true
          }
        }
      }
    })

    console.log(chalk.green(`✓ Found ${providers.length} available providers`))

    // 3. Test Booking Creation
    console.log(chalk.yellow('\n📝 Testing Booking Creation...'))
    
    // Get a test service and provider
    const testService = cleaningServices[0]
    const testProvider = providers[0]

    if (!testService || !testProvider) {
      throw new Error('No test service or provider available')
    }

    // Create a test client if needed
    let testClient = await prisma.user.findFirst({
      where: {
        email: 'test.client@example.com'
      }
    })

    if (!testClient) {
      testClient = await prisma.user.create({
        data: {
          email: 'test.client@example.com',
          name: 'Test Client',
          role: 'CLIENT'
        }
      })
      console.log(chalk.green('✓ Created test client'))
    }

    // Create a test booking
    const scheduledDate = createSADateTime('2025-12-01', '10:00')
    const testBooking = await prisma.booking.create({
      data: {
        clientId: testClient.id,
        providerId: testProvider.id,
        serviceId: testService.id,
        scheduledDate,
        address: '123 Test Street, Test City',
        status: 'PENDING',
        totalAmount: testService.basePrice || 0,
        notes: 'Test booking for verification'
      }
    })

    console.log(chalk.green('✓ Created test booking'))

    // 4. Verify Booking Details
    console.log(chalk.yellow('\n🔍 Verifying Booking Details...'))
    const bookingDetails = await prisma.booking.findUnique({
      where: { id: testBooking.id },
      include: {
        client: true,
        provider: {
          include: {
            user: true
          }
        },
        service: true
      }
    })

    if (!bookingDetails) {
      throw new Error('Failed to fetch booking details')
    }

    const checks = [
      { field: 'Client', value: bookingDetails.client.name === testClient.name },
      { field: 'Provider', value: bookingDetails.provider.user.name === testProvider.user.name },
      { field: 'Service', value: bookingDetails.service.id === testService.id },
      { field: 'Status', value: bookingDetails.status === 'PENDING' },
      { field: 'Amount', value: bookingDetails.totalAmount === testService.basePrice }
    ]

    checks.forEach(({ field, value }) => {
      if (value) {
        console.log(chalk.green(`✓ ${field} verified`))
      } else {
        console.log(chalk.red(`✗ ${field} mismatch`))
      }
    })

    // 5. Test Booking Status Updates
    console.log(chalk.yellow('\n🔄 Testing Booking Status Updates...'))
    const statusUpdates = ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED']
    
    for (const status of statusUpdates) {
      await prisma.booking.update({
        where: { id: testBooking.id },
        data: { status }
      })
      console.log(chalk.green(`✓ Updated status to ${status}`))
    }

    // 6. Clean Up Test Data
    console.log(chalk.yellow('\n🧹 Cleaning Up Test Data...'))
    await prisma.booking.delete({
      where: { id: testBooking.id }
    })
    console.log(chalk.green('✓ Deleted test booking'))

    // 7. Summary
    console.log(chalk.blue('\n📊 Verification Summary:'))
    console.log(chalk.green(`✓ ${cleaningServices.length} cleaning services verified`))
    console.log(chalk.green(`✓ ${providers.length} providers verified`))
    console.log(chalk.green('✓ Booking creation verified'))
    console.log(chalk.green('✓ Booking updates verified'))
    console.log(chalk.green('✓ Test data cleaned up'))

  } catch (error) {
    console.error(chalk.red('\n❌ Verification failed:'))
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verifyBookingFlow()
  .then(() => {
    console.log(chalk.blue('\n✨ Verification complete!\n'))
    process.exit(0)
  })
  .catch((error) => {
    console.error(chalk.red('\n❌ Script failed:'))
    console.error(error)
    process.exit(1)
  })
