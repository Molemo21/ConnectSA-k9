import { PrismaClient } from '@prisma/client';
import { SERVICES } from '../config/service-categories';

const prisma = new PrismaClient();

async function verifyServiceSync() {
  console.log('🔍 Starting service sync verification...');

  try {
    // Get all services from database
    const dbServices = await prisma.service.findMany({
      orderBy: { name: 'asc' }
    });

    console.log('\n📊 Database Services:', dbServices.length);
    console.log('📝 Config Services:', SERVICES.length);

    // Verify counts match
    if (dbServices.length !== SERVICES.length) {
      console.error('❌ Service count mismatch!');
      console.error(`Database has ${dbServices.length} services, config has ${SERVICES.length} services`);
      process.exit(1);
    }

    // Verify each service
    const errors: string[] = [];
    
    // Check database services exist in config
    for (const dbService of dbServices) {
      const configService = SERVICES.find(s => s.name === dbService.name);
      if (!configService) {
        errors.push(`Service "${dbService.name}" exists in database but not in config`);
        continue;
      }

      // Verify properties match
      if (dbService.category !== configService.category) {
        errors.push(`Service "${dbService.name}" category mismatch: DB=${dbService.category}, Config=${configService.category}`);
      }
      if (dbService.basePrice !== configService.basePrice) {
        errors.push(`Service "${dbService.name}" price mismatch: DB=${dbService.basePrice}, Config=${configService.basePrice}`);
      }
      if (dbService.isActive !== configService.isActive) {
        errors.push(`Service "${dbService.name}" active status mismatch: DB=${dbService.isActive}, Config=${configService.isActive}`);
      }
    }

    // Check config services exist in database
    for (const configService of SERVICES) {
      const dbService = dbServices.find(s => s.name === configService.name);
      if (!dbService) {
        errors.push(`Service "${configService.name}" exists in config but not in database`);
      }
    }

    // Report results
    if (errors.length > 0) {
      console.error('\n❌ Sync verification failed:');
      errors.forEach(error => console.error(`- ${error}`));
      process.exit(1);
    }

    console.log('\n✅ Services are in sync!');
    console.log('\nService Details:');
    dbServices.forEach(service => {
      console.log(`
${service.name}
- Category: ${service.category}
- Price: R${service.basePrice}
- Active: ${service.isActive}
- Created: ${service.createdAt}
`);
    });

  } catch (error) {
    console.error('❌ Error during verification:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyServiceSync();
