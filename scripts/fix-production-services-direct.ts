/**
 * 🔧 DIRECT PRODUCTION SERVICES FIX
 * 
 * This script directly fixes production database services to match config/services.ts exactly.
 * It handles:
 * - Renaming "House Cleaning" → "Standard House Cleaning"
 * - Removing "Cleaning Services" service (invalid - it's a category)
 * - Creating missing services: "Mobile Car Wash", "Office Cleaning"
 * - Updating all services to match config
 * 
 * Usage:
 *   PROD_DATABASE_URL=your-url npm run fix:production:services:direct
 */

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
const envProdLocalPath = resolve(process.cwd(), '.env.production.local');
config({ path: envProdLocalPath });

const dbUrl = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ ERROR: PROD_DATABASE_URL or DATABASE_URL environment variable is required');
  console.error('   Set PROD_DATABASE_URL to your production database URL');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl
    }
  }
});

interface FixStats {
  renamed: number;
  deleted: number;
  created: number;
  updated: number;
  errors: number;
}

async function fixProductionServicesDirect() {
  console.log('🔧 DIRECT PRODUCTION SERVICES FIX\n');
  console.log('='.repeat(70) + '\n');
  console.log('This script will directly fix production database to match config/services.ts\n');
  console.log(`Using database: ${dbUrl.substring(0, 50)}...\n`);

  const stats: FixStats = {
    renamed: 0,
    deleted: 0,
    created: 0,
    updated: 0,
    errors: 0
  };

  try {
    // Step 1: Get Cleaning Services category
    console.log('📋 Step 1: Finding Cleaning Services Category\n');
    const cleaningCategory = await prisma.serviceCategory.findFirst({
      where: { name: 'Cleaning Services' }
    });

    if (!cleaningCategory) {
      console.error('❌ Cleaning Services category not found!');
      process.exit(1);
    }
    console.log(`✅ Found: Cleaning Services category (ID: ${cleaningCategory.id})\n`);

    // Step 2: Rename "House Cleaning" → "Standard House Cleaning"
    console.log('📋 Step 2: Renaming "House Cleaning" → "Standard House Cleaning"\n');
    const houseCleaning = await prisma.service.findFirst({
      where: {
        name: 'House Cleaning',
        categoryId: cleaningCategory.id
      },
      include: {
        providers: true,
        bookings: true
      }
    });

    if (houseCleaning) {
      // Check if "Standard House Cleaning" already exists
      const standardHouseCleaning = await prisma.service.findFirst({
        where: {
          name: 'Standard House Cleaning',
          categoryId: cleaningCategory.id
        }
      });

      if (standardHouseCleaning) {
        console.log('⚠️  "Standard House Cleaning" already exists');
        // If old service has no relationships, delete it
        if (houseCleaning.providers.length === 0 && houseCleaning.bookings.length === 0) {
          await prisma.service.delete({ where: { id: houseCleaning.id } });
          console.log('✅ Deleted duplicate "House Cleaning" service');
          stats.deleted++;
        } else {
          console.log('⚠️  "House Cleaning" has relationships - keeping both for now');
        }
      } else {
        // Get config service
        const configService = SERVICES.find(s => s.name === 'Standard House Cleaning');
        if (configService) {
          await prisma.service.update({
            where: { id: houseCleaning.id },
            data: {
              name: 'Standard House Cleaning',
              description: configService.description,
              basePrice: configService.basePrice,
              isActive: configService.isActive
            }
          });
          console.log('✅ Renamed "House Cleaning" → "Standard House Cleaning"');
          stats.renamed++;
        }
      }
    } else {
      console.log('✓ "House Cleaning" not found (good - might already be renamed)\n');
    }

    // Step 3: Remove "Cleaning Services" service (invalid - it's a category)
    console.log('\n📋 Step 3: Removing Invalid "Cleaning Services" Service\n');
    const cleaningServicesService = await prisma.service.findFirst({
      where: {
        name: 'Cleaning Services',
        categoryId: cleaningCategory.id
      },
      include: {
        providers: true,
        bookings: true
      }
    });

    if (cleaningServicesService) {
      const hasRelationships = cleaningServicesService.providers.length > 0 || cleaningServicesService.bookings.length > 0;
      
      if (hasRelationships) {
        console.log('⚠️  "Cleaning Services" service has relationships - deactivating instead');
        await prisma.service.update({
          where: { id: cleaningServicesService.id },
          data: {
            isActive: false,
            name: 'Cleaning Services (INVALID - DEACTIVATED)'
          }
        });
        console.log('✅ Deactivated invalid "Cleaning Services" service');
        stats.updated++;
      } else {
        await prisma.service.delete({
          where: { id: cleaningServicesService.id }
        });
        console.log('✅ Deleted invalid "Cleaning Services" service');
        stats.deleted++;
      }
    } else {
      console.log('✓ "Cleaning Services" service not found (good)\n');
    }

    // Step 4: Ensure all cleaning services from config exist
    console.log('\n📋 Step 4: Ensuring All Cleaning Services from config/services.ts Exist\n');
    const cleaningServices = SERVICES.filter(s => s.category === 'CLEANING');
    console.log(`Total cleaning services in config: ${cleaningServices.length}\n`);

    for (const serviceConfig of cleaningServices) {
      const existingService = await prisma.service.findFirst({
        where: {
          name: serviceConfig.name,
          categoryId: cleaningCategory.id
        }
      });

      if (!existingService) {
        // Service doesn't exist - create it
        try {
          await prisma.service.create({
            data: {
              name: serviceConfig.name,
              description: serviceConfig.description,
              basePrice: serviceConfig.basePrice,
              isActive: serviceConfig.isActive,
              categoryId: cleaningCategory.id
            }
          });
          console.log(`✅ Created: "${serviceConfig.name}" (R${serviceConfig.basePrice})`);
          stats.created++;
        } catch (error) {
          console.error(`❌ Error creating "${serviceConfig.name}":`, error instanceof Error ? error.message : error);
          stats.errors++;
        }
      } else {
        // Service exists - check if it needs updating
        const needsUpdate =
          existingService.description !== serviceConfig.description ||
          existingService.basePrice !== serviceConfig.basePrice ||
          existingService.isActive !== serviceConfig.isActive;

        if (needsUpdate) {
          try {
            await prisma.service.update({
              where: { id: existingService.id },
              data: {
                description: serviceConfig.description,
                basePrice: serviceConfig.basePrice,
                isActive: serviceConfig.isActive
              }
            });
            console.log(`🔄 Updated: "${serviceConfig.name}"`);
            stats.updated++;
          } catch (error) {
            console.error(`❌ Error updating "${serviceConfig.name}":`, error instanceof Error ? error.message : error);
            stats.errors++;
          }
        } else {
          console.log(`✓ Exists: "${serviceConfig.name}" (already in sync)`);
        }
      }
    }

    // Step 5: Final verification
    console.log('\n📋 Step 5: Final Verification\n');
    const finalServices = await prisma.service.findMany({
      where: { categoryId: cleaningCategory.id, isActive: true },
      orderBy: { name: 'asc' }
    });

    const configServiceNames = new Set(cleaningServices.map(s => s.name));
    const dbServiceNames = new Set(finalServices.map(s => s.name));

    let allMatch = true;
    for (const configName of configServiceNames) {
      if (!dbServiceNames.has(configName)) {
        console.error(`❌ "${configName}" is MISSING in database`);
        allMatch = false;
      }
    }

    for (const dbName of dbServiceNames) {
      if (!configServiceNames.has(dbName) && dbName !== 'Cleaning Services (INVALID - DEACTIVATED)') {
        console.error(`❌ "${dbName}" is in database but NOT in config`);
        allMatch = false;
      }
    }

    if (allMatch) {
      console.log('✅ All services match config/services.ts!\n');
    } else {
      console.error('❌ Verification failed - some services still don\'t match\n');
      process.exit(1);
    }

    // Summary
    console.log('📊 SUMMARY');
    console.log('='.repeat(70));
    console.log(`   Renamed: ${stats.renamed}`);
    console.log(`   Deleted: ${stats.deleted}`);
    console.log(`   Created: ${stats.created}`);
    console.log(`   Updated: ${stats.updated}`);
    console.log(`   Errors: ${stats.errors}`);
    console.log('\n✨ Production services are now in sync with config/services.ts!\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixProductionServicesDirect()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  });
