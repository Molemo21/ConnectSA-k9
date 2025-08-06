import { prisma } from '../lib/prisma-fixed';

async function assignServices() {
  try {
    console.log('Assigning services to providers...');
    
    // Get all approved providers
    const providers = await prisma.provider.findMany({
      where: {
        status: "APPROVED",
      },
      include: {
        user: {
          select: {
            name: true,
          }
        }
      }
    });
    
    // Get all services
    const services = await prisma.service.findMany();
    
    console.log(`Found ${providers.length} approved providers and ${services.length} services`);
    
    // Assign services to providers
    for (const provider of providers) {
      // Assign 2-3 random services to each provider
      const numServices = Math.floor(Math.random() * 3) + 2; // 2-4 services
      const selectedServices = services
        .sort(() => 0.5 - Math.random()) // Shuffle
        .slice(0, numServices);
      
      for (const service of selectedServices) {
        // Check if service is already assigned
        const existing = await prisma.providerService.findFirst({
          where: {
            providerId: provider.id,
            serviceId: service.id,
          }
        });
        
        if (!existing) {
          await prisma.providerService.create({
            data: {
              providerId: provider.id,
              serviceId: service.id,
              customRate: Math.floor(Math.random() * 200) + 100, // R100-R300 per hour
            }
          });
          console.log(`Assigned ${service.name} to ${provider.user.name}`);
        }
      }
    }
    
    console.log('Service assignment completed!');
    
    // Show results
    const updatedProviders = await prisma.provider.findMany({
      where: {
        status: "APPROVED",
      },
      include: {
        user: {
          select: {
            name: true,
          }
        },
        services: {
          include: {
            service: true,
          }
        }
      }
    });
    
    console.log('\nUpdated providers:');
    updatedProviders.forEach((provider) => {
      console.log(`${provider.user.name}: ${provider.services.map(ps => ps.service.name).join(', ')}`);
    });
    
  } catch (error) {
    console.error('❌ Assignment failed:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Database disconnected');
  }
}

assignServices(); 