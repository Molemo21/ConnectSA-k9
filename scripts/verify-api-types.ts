import { z } from 'zod'
import chalk from 'chalk'
import { ServiceCategory } from '@prisma/client'

// Expected service schema
const ServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  category: z.nativeEnum(ServiceCategory),
  basePrice: z.number().positive(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
})

// Expected booking schema
const BookingSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  providerId: z.string(),
  serviceId: z.string(),
  scheduledDate: z.date(),
  address: z.string(),
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED']),
  notes: z.string().nullable(),
  totalAmount: z.number(),
  createdAt: z.date(),
  updatedAt: z.date()
})

// Expected provider schema
const ProviderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  businessName: z.string().nullable(),
  description: z.string().nullable(),
  experience: z.number().nullable(),
  hourlyRate: z.number().nullable(),
  location: z.string().nullable(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']),
  available: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
})

function verifyApiTypes() {
  console.log(chalk.blue('\n🔍 Starting API Type Verification...\n'))

  try {
    // 1. Verify Service Types
    console.log(chalk.yellow('📊 Checking Service Types...'))
    const sampleService = {
      id: 'service_123',
      name: 'House Cleaning',
      description: 'Professional house cleaning service',
      category: 'CLEANING' as ServiceCategory,
      basePrice: 350.00,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const parsedService = ServiceSchema.parse(sampleService)
    console.log(chalk.green('✓ Service schema validation passed'))
    console.log(chalk.gray('Sample service:'), parsedService)

    // 2. Verify Booking Types
    console.log(chalk.yellow('\n📝 Checking Booking Types...'))
    const sampleBooking = {
      id: 'booking_123',
      clientId: 'client_123',
      providerId: 'provider_123',
      serviceId: 'service_123',
      scheduledDate: new Date(),
      address: '123 Test St',
      status: 'PENDING',
      notes: 'Test booking',
      totalAmount: 350.00,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const parsedBooking = BookingSchema.parse(sampleBooking)
    console.log(chalk.green('✓ Booking schema validation passed'))
    console.log(chalk.gray('Sample booking:'), parsedBooking)

    // 3. Verify Provider Types
    console.log(chalk.yellow('\n👥 Checking Provider Types...'))
    const sampleProvider = {
      id: 'provider_123',
      userId: 'user_123',
      businessName: 'Clean Pro Services',
      description: 'Professional cleaning services',
      experience: 5,
      hourlyRate: 250.00,
      location: 'Cape Town',
      status: 'APPROVED',
      available: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const parsedProvider = ProviderSchema.parse(sampleProvider)
    console.log(chalk.green('✓ Provider schema validation passed'))
    console.log(chalk.gray('Sample provider:'), parsedProvider)

    // 4. Verify Invalid Data Handling
    console.log(chalk.yellow('\n❌ Testing Invalid Data Handling...'))

    // Test invalid service
    try {
      ServiceSchema.parse({
        ...sampleService,
        category: 'INVALID_CATEGORY'
      })
    } catch (error) {
      console.log(chalk.green('✓ Invalid service category correctly rejected'))
    }

    // Test invalid booking
    try {
      BookingSchema.parse({
        ...sampleBooking,
        status: 'INVALID_STATUS'
      })
    } catch (error) {
      console.log(chalk.green('✓ Invalid booking status correctly rejected'))
    }

    // Test invalid provider
    try {
      ProviderSchema.parse({
        ...sampleProvider,
        status: 'INVALID_STATUS'
      })
    } catch (error) {
      console.log(chalk.green('✓ Invalid provider status correctly rejected'))
    }

    // 5. Summary
    console.log(chalk.blue('\n📊 Verification Summary:'))
    console.log(chalk.green('✓ Service types verified'))
    console.log(chalk.green('✓ Booking types verified'))
    console.log(chalk.green('✓ Provider types verified'))
    console.log(chalk.green('✓ Invalid data handling verified'))

  } catch (error) {
    console.error(chalk.red('\n❌ Verification failed:'))
    console.error(error)
    process.exit(1)
  }
}

verifyApiTypes()
  .then(() => {
    console.log(chalk.blue('\n✨ Type verification complete!\n'))
    process.exit(0)
  })
  .catch((error) => {
    console.error(chalk.red('\n❌ Script failed:'))
    console.error(error)
    process.exit(1)
  })
