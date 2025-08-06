import { prisma } from '../lib/prisma-fixed';

async function testProviders() {
  try {
    console.log('Testing providers in database...');
    
    // Check all providers
    const allProviders = await prisma.provider.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        },
        services: {
          include: {
            service: true,
          }
        }
      }
    });
    
    console.log(`Found ${allProviders.length} providers:`);
    allProviders.forEach((provider, index) => {
      console.log(`${index + 1}. ${provider.user.name} (${provider.user.email})`);
      console.log(`   Status: ${provider.status}`);
      console.log(`   Available: ${provider.available}`);
      console.log(`   Services: ${provider.services.map(ps => ps.service.name).join(', ')}`);
      console.log('');
    });
    
    // Check services
    const services = await prisma.service.findMany();
    console.log(`Found ${services.length} services:`);
    services.forEach((service, index) => {
      console.log(`${index + 1}. ${service.name} (${service.id})`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Database disconnected');
  }
}

testProviders(); 