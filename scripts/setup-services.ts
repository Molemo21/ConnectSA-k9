import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Setting up Haircut and Garden services...')

  // Create the two services
  const haircutService = await prisma.service.upsert({
    where: { id: 'haircut-service' },
    update: {},
    create: {
      id: 'haircut-service',
      name: 'Haircut',
      description: 'Professional haircut and styling services',
      category: 'Beauty & Personal Care',
      basePrice: 25.0,
      isActive: true,
    },
  })

  const gardenService = await prisma.service.upsert({
    where: { id: 'garden-service' },
    update: {},
    create: {
      id: 'garden-service',
      name: 'Garden',
      description: 'Garden maintenance, landscaping, and plant care services',
      category: 'Home & Garden',
      basePrice: 50.0,
      isActive: true,
    },
  })

  console.log('✅ Services created:', { haircut: haircutService.name, garden: gardenService.name })

  // Get all existing providers
  const providers = await prisma.provider.findMany({
    where: { status: 'APPROVED' },
    include: { services: true }
  })

  console.log(`📊 Found ${providers.length} approved providers`)

  // Randomly assign one service to each provider (for MVP demo)
  for (const provider of providers) {
    // Remove existing services
    await prisma.providerService.deleteMany({
      where: { providerId: provider.id }
    })

    // Randomly assign either Haircut or Garden service
    const randomService = Math.random() > 0.5 ? haircutService : gardenService
    
    await prisma.providerService.create({
      data: {
        providerId: provider.id,
        serviceId: randomService.id,
        customRate: randomService.basePrice + (Math.random() * 20 - 10), // ±$10 variation
      }
    })

    console.log(`🎯 Provider ${provider.user?.name || provider.id} assigned to ${randomService.name}`)
  }

  console.log('✅ All providers assigned to one service each')
  console.log('🎉 Service setup complete!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 