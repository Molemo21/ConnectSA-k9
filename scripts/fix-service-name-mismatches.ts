import { PrismaClient } from '@prisma/client';
import { SERVICES } from '../config/services';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
const envPath = resolve(process.cwd(), '.env');
config({ path: envPath });
const envProdPath = resolve(process.cwd(), '.env.production');
config({ path: envProdPath });
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

// Service name mappings: old name -> new name (from config/services.ts)
const SERVICE_NAME_FIXES: Record<string, string> = {
  'House Cleaning': 'Standard House Cleaning', // Fix mismatch
};

// Services that should NOT exist (category names, etc.)
const INVALID_SERVICE_NAMES = [
  'Cleaning Services', // This is a category name, not a service
];

async function fixServiceNameMismatches() {
  console.log('🔧 Fixing Service Name Mismatches\n');
  console.log('='.repeat(70) + '\n');
  console.log('⚠️  WARNING: This script will modify service names in the database!');
  console.log('   Ensure you have a backup before proceeding.\n');
  console.log('='.repeat(70) + '\n');

  try {
    // Step 1: Get cleaning category
    const cleaningCategory = await prisma.serviceCategory.findFirst({
      where: { name: 'Cleaning Services' },
      include: {
        services: {
          where: { isActive: true }
        }
      }
    });

    if (!cleaningCategory) {
      console.error('❌ Cleaning Services category not found in database');
      process.exit(1);
    }

    console.log(`✅ Found Cleaning Services category (${cleaningCategory.services.length} services)\n`);

    // Step 2: Fix service name mismatches
    console.log('📋 Step 1: Fixing Service Name Mismatches\n');
    
    let fixedCount = 0;
    for (const [oldName, newName] of Object.entries(SERVICE_NAME_FIXES)) {
      const oldService = cleaningCategory.services.find(s => s.name === oldName);
      
      if (oldService) {
        // Check if new name already exists
        const existingNewService = cleaningCategory.services.find(s => s.name === newName);
        
        if (existingNewService) {
          console.warn(`   ⚠️  Service "${newName}" already exists`);
          console.warn(`   ⚠️  Skipping rename of "${oldName}" to avoid duplicate`);
          console.warn(`   💡 Manual intervention required: decide which service to keep\n`);
        } else {
          // Get config service to update other fields too
          const configService = SERVICES.find(s => s.name === newName);
          
          if (configService) {
            await prisma.service.update({
              where: { id: oldService.id },
              data: {
                name: newName,
                description: configService.description,
                basePrice: configService.basePrice,
              }
            });
            console.log(`   ✅ Renamed "${oldName}" → "${newName}"`);
            fixedCount++;
          } else {
            console.error(`   ❌ Config service "${newName}" not found - cannot fix`);
          }
        }
      } else {
        console.log(`   ✓ Service "${oldName}" not found (may already be fixed)`);
      }
    }

    // Step 3: Remove invalid service names (category names that shouldn't be services)
    console.log('\n📋 Step 2: Removing Invalid Service Names\n');
    
    let removedCount = 0;
    for (const invalidName of INVALID_SERVICE_NAMES) {
      const invalidService = cleaningCategory.services.find(s => s.name === invalidName);
      
      if (invalidService) {
        // Check if service has relationships
        const hasProviders = await prisma.providerService.count({
          where: { serviceId: invalidService.id }
        });
        const hasBookings = await prisma.booking.count({
          where: { serviceId: invalidService.id }
        });

        if (hasProviders > 0 || hasBookings > 0) {
          console.warn(`   ⚠️  Service "${invalidName}" has relationships:`);
          console.warn(`      - ${hasProviders} provider(s)`);
          console.warn(`      - ${hasBookings} booking(s)`);
          console.warn(`   ⚠️  Cannot delete safely - deactivating instead\n`);
          
          await prisma.service.update({
            where: { id: invalidService.id },
            data: {
              isActive: false,
              name: `${invalidName} (INVALID - DEACTIVATED)`
            }
          });
          console.log(`   ✅ Deactivated invalid service: "${invalidName}"`);
        } else {
          await prisma.service.delete({
            where: { id: invalidService.id }
          });
          console.log(`   ✅ Deleted invalid service: "${invalidName}"`);
          removedCount++;
        }
      } else {
        console.log(`   ✓ Invalid service "${invalidName}" not found`);
      }
    }

    // Step 4: Ensure all config services exist
    console.log('\n📋 Step 3: Ensuring All Config Services Exist\n');
    
    const configCleaningServices = SERVICES.filter(s => s.category === 'CLEANING');
    let createdCount = 0;
    
    for (const configService of configCleaningServices) {
      const existingService = cleaningCategory.services.find(s => s.name === configService.name);
      
      if (!existingService) {
        await prisma.service.create({
          data: {
            name: configService.name,
            description: configService.description,
            basePrice: configService.basePrice,
            isActive: configService.isActive,
            categoryId: cleaningCategory.id,
          }
        });
        console.log(`   ✅ Created missing service: "${configService.name}"`);
        createdCount++;
      } else {
        // Update existing service to match config
        if (
          existingService.description !== configService.description ||
          existingService.basePrice !== configService.basePrice ||
          existingService.isActive !== configService.isActive
        ) {
          await prisma.service.update({
            where: { id: existingService.id },
            data: {
              description: configService.description,
              basePrice: configService.basePrice,
              isActive: configService.isActive,
            }
          });
          console.log(`   🔄 Updated service: "${configService.name}"`);
        } else {
          console.log(`   ✓ Service "${configService.name}" is already in sync`);
        }
      }
    }

    // Step 5: Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 FIX SUMMARY\n');
    console.log(`   ✅ Services renamed: ${fixedCount}`);
    console.log(`   ✅ Invalid services removed/deactivated: ${removedCount}`);
    console.log(`   ✅ Missing services created: ${createdCount}\n`);

    // Step 6: Verify final state
    console.log('📋 Step 4: Verifying Final State\n');
    
    const finalServices = await prisma.service.findMany({
      where: {
        categoryId: cleaningCategory.id,
        isActive: true
      },
      orderBy: { name: 'asc' }
    });

    console.log(`   Active cleaning services in database: ${finalServices.length}\n`);
    finalServices.forEach(s => {
      console.log(`   ✅ ${s.name} (R${s.basePrice})`);
    });

    const configServiceNames = new Set(configCleaningServices.map(s => s.name));
    const dbServiceNames = new Set(finalServices.map(s => s.name));
    
    const missingInDb = [...configServiceNames].filter(x => !dbServiceNames.has(x));
    const extraInDb = [...dbServiceNames].filter(x => !configServiceNames.has(x));

    if (missingInDb.length > 0) {
      console.error(`\n   ❌ Services in config but missing in DB: ${missingInDb.join(', ')}`);
    }
    if (extraInDb.length > 0) {
      console.warn(`\n   ⚠️  Services in DB but not in config: ${extraInDb.join(', ')}`);
    }

    if (missingInDb.length === 0 && extraInDb.length === 0) {
      console.log('\n   ✅ All services are in sync!\n');
    }

    console.log('='.repeat(70) + '\n');
    console.log('✨ Service name fixes completed!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixServiceNameMismatches()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  });
