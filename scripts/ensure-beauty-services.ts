import { PrismaClient } from '@prisma/client';
import { SERVICES } from '../config/services';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
const envPath = resolve(process.cwd(), '.env');
config({ path: envPath });

const envDevPath = resolve(process.cwd(), '.env.development');
config({ path: envDevPath });

const envLocalPath = resolve(process.cwd(), '.env.local');
config({ path: envLocalPath });

if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function ensureBeautyServices() {
  console.log('💄 Ensuring Beauty Services are in database...\n');

  try {
    // Get all beauty services from config
    const beautyServicesConfig = SERVICES.filter(s => s.category === 'BEAUTY');
    
    console.log(`📋 Found ${beautyServicesConfig.length} beauty services in config:`);
    beautyServicesConfig.forEach(s => console.log(`   - ${s.name} (R${s.basePrice})`));
    console.log('');

    // Get or create Beauty & Personal Care category
    let beautyCategory = await prisma.serviceCategory.findFirst({
      where: { name: 'Beauty & Personal Care' }
    });

    if (!beautyCategory) {
      beautyCategory = await prisma.serviceCategory.create({
        data: {
          name: 'Beauty & Personal Care',
          description: 'Professional beauty and personal care services',
          icon: '💄',
          isActive: true
        }
      });
      console.log(`✅ Created Beauty & Personal Care category (ID: ${beautyCategory.id})\n`);
    } else {
      console.log(`✅ Found Beauty & Personal Care category (ID: ${beautyCategory.id})\n`);
    }

    // Process each beauty service
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const serviceConfig of beautyServicesConfig) {
      // Check if service exists
      const existingService = await prisma.service.findFirst({
        where: {
          name: serviceConfig.name,
          categoryId: beautyCategory.id
        }
      });

      if (existingService) {
        // Update existing service to match config
        const updatedService = await prisma.service.update({
          where: { id: existingService.id },
          data: {
            description: serviceConfig.description,
            categoryId: beautyCategory.id,
            basePrice: serviceConfig.basePrice,
            isActive: serviceConfig.isActive,
          }
        });
        console.log(`🔄 Updated: ${updatedService.name} - R${updatedService.basePrice}`);
        updated++;
      } else {
        // Create new service
        const createdService = await prisma.service.create({
          data: {
            name: serviceConfig.name,
            description: serviceConfig.description,
            categoryId: beautyCategory.id,
            basePrice: serviceConfig.basePrice,
            isActive: serviceConfig.isActive,
          }
        });
        console.log(`✅ Created: ${createdService.name} - R${createdService.basePrice}`);
        created++;
      }
    }

    // Verify all services are accessible via API
    console.log('\n🔍 Verifying services are accessible via API...');
    const apiServices = await prisma.service.findMany({
      where: {
        categoryId: beautyCategory.id,
        isActive: true,
        category: {
          isActive: true
        }
      },
      include: {
        category: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`✅ ${apiServices.length} beauty services are active and accessible via API\n`);

    // Summary
    console.log('📊 Summary:');
    console.log(`   - Created: ${created}`);
    console.log(`   - Updated: ${updated}`);
    console.log(`   - Total in DB: ${apiServices.length}`);
    console.log(`   - Total in Config: ${beautyServicesConfig.length}`);

    if (apiServices.length === beautyServicesConfig.length) {
      console.log('\n✨ All beauty services are in sync with config!');
    } else {
      console.log('\n⚠️  Service count mismatch - some services may need attention');
    }

  } catch (error) {
    console.error('❌ Error ensuring beauty services:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

ensureBeautyServices()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  });
