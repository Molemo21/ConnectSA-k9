import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'path';
import { SERVICES } from '../config/services';

// Load environment variables from .env.development
const envPath = resolve(process.cwd(), '.env.development');
config({ path: envPath });

// Safety check: Require DATABASE_URL from environment
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is required');
  console.error('   Please set DATABASE_URL in your .env.development file');
  console.error(`   Looking for: ${envPath}`);
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

/**
 * Ensures a service category exists and is active
 */
async function ensureCategory(
  id: string,
  name: string,
  description: string,
  icon: string
): Promise<{ id: string; name: string }> {
  let category = await prisma.serviceCategory.findFirst({
    where: { name }
  });

  if (!category) {
    category = await prisma.serviceCategory.create({
      data: {
        id,
        name,
        description,
        icon,
        isActive: true
      }
    });
    console.log(`✅ Created "${name}" category`);
  } else {
    // Ensure it's active
    if (!category.isActive) {
      category = await prisma.serviceCategory.update({
        where: { id: category.id },
        data: { isActive: true }
      });
      console.log(`✅ Activated "${name}" category`);
    } else {
      console.log(`✅ "${name}" category exists and is active`);
    }
  }

  return { id: category.id, name: category.name };
}

/**
 * Syncs a single service from config to database
 */
async function syncService(
  serviceConfig: typeof SERVICES[number],
  categoryId: string,
  categoryName: string
): Promise<'created' | 'updated' | 'skipped'> {
  if (!serviceConfig.name || !serviceConfig.category) {
    console.log(`⚠️  Skipping invalid service config: ${JSON.stringify(serviceConfig)}`);
    return 'skipped';
  }

  // Find existing service by name
  const existing = await prisma.service.findFirst({
    where: { name: serviceConfig.name }
  });

  const serviceData = {
    name: serviceConfig.name,
    description: serviceConfig.description || null,
    categoryId,
    basePrice: serviceConfig.basePrice || null,
    isActive: serviceConfig.isActive !== false
  };

  if (existing) {
    // Update existing service
    await prisma.service.update({
      where: { id: existing.id },
      data: serviceData
    });
    console.log(`   🔄 Updated: ${serviceConfig.name} (${categoryName}) - R${serviceConfig.basePrice || 0}`);
    return 'updated';
  } else {
    // Create new service
    await prisma.service.create({
      data: serviceData
    });
    console.log(`   ✅ Created: ${serviceConfig.name} (${categoryName}) - R${serviceConfig.basePrice || 0}`);
    return 'created';
  }
}

async function syncServices() {
  console.log('🔄 Syncing database services with config/services.ts...\n');

  try {
    // Step 1: Ensure categories exist
    console.log('📊 Step 1: Ensuring service categories exist...');
    
    const cleaningCategory = await ensureCategory(
      'cat_cleaning',
      'Cleaning Services',
      'Professional cleaning services for homes and offices',
      '🧹'
    );

    const beautyCategory = await ensureCategory(
      'cat_beauty',
      'Beauty & Personal Care',
      'Professional beauty and personal care services',
      '💄'
    );

    // Step 2: Get all existing services
    console.log('\n📊 Step 2: Checking existing services...');
    const existingServices = await prisma.service.findMany();
    console.log(`   Found ${existingServices.length} existing services in database`);

    // Step 3: Sync services from config
    console.log('\n🔄 Step 3: Syncing services from config/services.ts...');
    console.log(`   Found ${SERVICES.length} services in config\n`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const serviceConfig of SERVICES) {
      if (!serviceConfig.name || !serviceConfig.category) {
        skipped++;
        continue;
      }

      // Determine category based on service config
      const category = serviceConfig.category === 'CLEANING' 
        ? cleaningCategory 
        : serviceConfig.category === 'BEAUTY' 
        ? beautyCategory 
        : null;

      if (!category) {
        console.log(`⚠️  Skipping service "${serviceConfig.name}" - unknown category: ${serviceConfig.category}`);
        skipped++;
        continue;
      }

      const result = await syncService(serviceConfig, category.id, category.name);
      if (result === 'created') created++;
      else if (result === 'updated') updated++;
      else skipped++;
    }

    // Step 4: Deactivate services not in config (but don't delete them)
    console.log('\n📊 Step 4: Checking for services not in config...');
    const configServiceNames = SERVICES.map(s => s.name).filter(Boolean);
    const servicesNotInConfig = existingServices.filter(
      s => !configServiceNames.includes(s.name)
    );

    if (servicesNotInConfig.length > 0) {
      console.log(`   Found ${servicesNotInConfig.length} services not in config:`);
      for (const service of servicesNotInConfig) {
        await prisma.service.update({
          where: { id: service.id },
          data: { isActive: false }
        });
        console.log(`   ⚠️  Deactivated: ${service.name} (not in config)`);
      }
    } else {
      console.log('   ✅ All existing services are in config');
    }

    // Step 5: Final verification
    console.log('\n📊 Step 5: Final verification...');
    const finalServices = await prisma.service.findMany({
      where: {
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

    const cleaningServices = finalServices.filter(s => s.category.name === 'Cleaning Services');
    const beautyServices = finalServices.filter(s => s.category.name === 'Beauty & Personal Care');

    console.log(`\n✅ SYNC COMPLETE!`);
    console.log(`   📊 Summary:`);
    console.log(`      - Created: ${created} services`);
    console.log(`      - Updated: ${updated} services`);
    console.log(`      - Skipped: ${skipped} services`);
    console.log(`      - Deactivated: ${servicesNotInConfig.length} services`);
    console.log(`\n   📈 Final counts:`);
    console.log(`      - Total active services: ${finalServices.length}`);
    console.log(`      - Cleaning Services: ${cleaningServices.length}`);
    console.log(`      - Beauty Services: ${beautyServices.length}`);

    if (cleaningServices.length > 0) {
      console.log(`\n   🧹 Cleaning Services:`);
      cleaningServices.forEach(s => {
        console.log(`      - ${s.name} - R${s.basePrice || 0}`);
      });
    }

    if (beautyServices.length > 0) {
      console.log(`\n   💅 Beauty Services:`);
      beautyServices.forEach(s => {
        console.log(`      - ${s.name} - R${s.basePrice || 0}`);
      });
    }

    console.log(`\n🎉 Database is now consistent with config/services.ts!`);
    console.log(`   Restart your dev server if it's running to see the changes.`);

  } catch (error) {
    console.error('\n❌ Error during sync:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
syncServices()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  });
