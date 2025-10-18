const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

interface Provider {
  id: string
  user?: {
    name: string | null
    email: string | null
  } | null
  services: any[]
}

interface Service {
  id: string
  name: string
  category: string
  description: string | null
  basePrice?: number
}

interface ProviderService {
  service: {
    name: string
  }
}

async function assignProviderServices() {
  console.log('=== Provider Services Assignment Tool ===\n')

  try {
    // Get all providers without services
    const providersWithoutServices = await prisma.provider.findMany({
      where: {
        services: {
          none: {}
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        services: true
      }
    })

    // Get all available services
    const allServices = await prisma.service.findMany({
      orderBy: {
        categoryId: 'asc'
      }
    })

    // Group services by category
    const servicesByCategory = allServices.reduce((acc: { [key: string]: Service[] }, service: Service) => {
      const category = service.category || 'Uncategorized'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(service)
      return acc
    }, {})

    console.log('Available Service Categories:')
    Object.keys(servicesByCategory).forEach((category, index) => {
      console.log(`${index + 1}. ${category} (${servicesByCategory[category].length} services)`)
    })

    if (providersWithoutServices.length === 0) {
      console.log('\n✅ All providers have services assigned!')
      return
    }

    console.log(`\nFound ${providersWithoutServices.length} providers without services:`)
    providersWithoutServices.forEach((provider: Provider, index: number) => {
      console.log(`\n${index + 1}. Provider: ${provider.user?.name || 'Unknown'} (${provider.user?.email || 'No email'})`)
      console.log(`   ID: ${provider.id}`)
    })

    // For each provider, assign default services based on their category
    console.log('\nAssigning default services to providers...')
    
    for (const provider of providersWithoutServices) {
      console.log(`\nProcessing provider: ${provider.user?.name || 'Unknown'}`)

      // Get all services as default
      const defaultServices = await prisma.service.findMany()

      if (defaultServices.length === 0) {
        console.log('⚠️ No services found to assign')
        continue
      }

      try {
        // Delete any existing services first
        await prisma.providerService.deleteMany({
          where: {
            providerId: provider.id
          }
        })

        // Create new services one by one
        for (const service of defaultServices) {
          await prisma.providerService.create({
            data: {
              providerId: provider.id,
              serviceId: service.id
            }
          })
        }

        console.log(`✅ Assigned ${defaultServices.length} services to provider`)
        
        // List assigned services
        const assignedServices = await prisma.providerService.findMany({
          where: {
            providerId: provider.id
          },
          include: {
            service: true
          }
        })

        console.log('\nAssigned Services:')
        assignedServices.forEach((ps: ProviderService) => {
          console.log(`- ${ps.service.name}`)
        })

      } catch (error) {
        console.error(`❌ Error assigning services to provider ${provider.id}:`, error)
      }
    }

    // Verify assignments
    console.log('\nVerifying service assignments...')
    const remainingProvidersWithoutServices = await prisma.provider.count({
      where: {
        services: {
          none: {}
        }
      }
    })

    if (remainingProvidersWithoutServices === 0) {
      console.log('\n✅ All providers have been assigned services successfully!')
    } else {
      console.log(`\n⚠️ There are still ${remainingProvidersWithoutServices} providers without services`)
    }

  } catch (error) {
    console.error('\n❌ Error assigning provider services:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the assignment
assignProviderServices()
  .catch(console.error)