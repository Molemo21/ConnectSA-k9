import { PrismaClient } from '@prisma/client';
import { SERVICES } from '../config/services';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables - try multiple files
const envPath = resolve(process.cwd(), '.env');
config({ path: envPath });

const envDevPath = resolve(process.cwd(), '.env.development');
config({ path: envDevPath });

const envLocalPath = resolve(process.cwd(), '.env.local');
config({ path: envLocalPath });

if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is required');
  console.error('   Please set DATABASE_URL in .env, .env.development, or .env.local');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function ensureMobileCarWash() {
  console.log('🚗 Ensuring Mobile Car Wash service is in database...\n');

  try {
    // Get Mobile Car Wash from config
    const mobileCarWashConfig = SERVICES.find(
      service => service.name === 'Mobile Car Wash'
    );

    if (!mobileCarWashConfig) {
      console.error('❌ Mobile Car Wash not found in config/services.ts');
      process.exit(1);
    }

    console.log('✅ Found Mobile Car Wash in config:');
    console.log(`   Name: ${mobileCarWashConfig.name}`);
    console.log(`   Description: ${mobileCarWashConfig.description}`);
    console.log(`   Category: ${mobileCarWashConfig.category}`);
    console.log(`   Base Price: R${mobileCarWashConfig.basePrice}`);
    console.log(`   Features: ${mobileCarWashConfig.features.join(', ')}`);
    console.log(`   Active: ${mobileCarWashConfig.isActive}\n`);

    // Get the cleaning category
    const cleaningCategory = await prisma.serviceCategory.findFirst({
      where: {
        name: 'Cleaning Services'
      }
    });

    if (!cleaningCategory) {
      console.error('❌ Cleaning Services category not found in database');
      console.error('   Please run migrations to create the category first');
      process.exit(1);
    }

    console.log(`✅ Found Cleaning Services category (ID: ${cleaningCategory.id})\n`);

    // Check if service already exists
    const existingService = await prisma.service.findFirst({
      where: {
        name: 'Mobile Car Wash'
      }
    });

    if (existingService) {
      // Update existing service to match config
      const updated = await prisma.service.update({
        where: { id: existingService.id },
        data: {
          description: mobileCarWashConfig.description,
          categoryId: cleaningCategory.id,
          basePrice: mobileCarWashConfig.basePrice,
          isActive: mobileCarWashConfig.isActive,
        }
      });

      console.log('🔄 Updated existing Mobile Car Wash service:');
      console.log(`   ID: ${updated.id}`);
      console.log(`   Name: ${updated.name}`);
      console.log(`   Base Price: R${updated.basePrice}`);
      console.log(`   Active: ${updated.isActive}`);
    } else {
      // Create new service
      const created = await prisma.service.create({
        data: {
          name: mobileCarWashConfig.name,
          description: mobileCarWashConfig.description,
          categoryId: cleaningCategory.id,
          basePrice: mobileCarWashConfig.basePrice,
          isActive: mobileCarWashConfig.isActive,
        }
      });

      console.log('✅ Created Mobile Car Wash service:');
      console.log(`   ID: ${created.id}`);
      console.log(`   Name: ${created.name}`);
      console.log(`   Base Price: R${created.basePrice}`);
      console.log(`   Active: ${created.isActive}`);
    }

    // Verify it's accessible via API
    console.log('\n🔍 Verifying service is accessible via API...');
    const apiService = await prisma.service.findFirst({
      where: {
        name: 'Mobile Car Wash',
        isActive: true,
        category: {
          isActive: true
        }
      },
      include: {
        category: true
      }
    });

    if (apiService) {
      console.log('✅ Service is active and accessible via API');
      console.log(`   Category: ${apiService.category.name}`);
    } else {
      console.log('⚠️  Service exists but may not be accessible via API');
      console.log('   Check that both service and category are active');
    }

    console.log('\n✨ Mobile Car Wash service is now in sync with config!');

  } catch (error) {
    console.error('❌ Error ensuring Mobile Car Wash service:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

ensureMobileCarWash()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  });
