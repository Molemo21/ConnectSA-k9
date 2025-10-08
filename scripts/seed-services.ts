import { PrismaClient } from '@prisma/client'
import { serviceCategories } from '../config/services'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting service seeding...')

  // Create services from configuration
  for (const [categoryId, category] of Object.entries(serviceCategories)) {
    console.log(`📦 Processing category: ${category.name}`)

    for (const service of category.services) {
      const existingService = await prisma.service.findFirst({
        where: {
          name: service.name,
          category: categoryId as any
        }
      })

      if (!existingService) {
        await prisma.service.create({
          data: {
            name: service.name,
            description: service.description,
            mainCategory: category.mainCategory as any,
            category: categoryId as any,
            basePrice: service.basePrice,
            duration: service.duration,
            features: service.features,
            isActive: true
          }
        })
        console.log(`✅ Created service: ${service.name}`)
      } else {
        await prisma.service.update({
          where: { id: existingService.id },
          data: {
            description: service.description,
            mainCategory: category.mainCategory as any,
            category: categoryId as any,
            basePrice: service.basePrice,
            duration: service.duration,
            features: service.features
          }
        })
        console.log(`🔄 Updated service: ${service.name}`)
      }
    }
  }

  console.log('✨ Service seeding completed')
}

main()
  .catch((e) => {
    console.error('Error seeding services:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
