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

if (!process.env.DATABASE_URL && !process.env.PROD_DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL or PROD_DATABASE_URL environment variable is required');
  console.error('   This script ensures services exist in PRODUCTION database');
  console.error('   Set PROD_DATABASE_URL to your production database URL');
  console.error('\n   Options:');
  console.error('   1. Set environment variable: export PROD_DATABASE_URL=your-url');
  console.error('   2. Create .env.production.local file with PROD_DATABASE_URL');
  process.exit(1);
}

const dbUrl = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ ERROR: DATABASE_URL or PROD_DATABASE_URL environment variable is required');
  console.error('   This script ensures services exist in PRODUCTION database');
  console.error('   Set PROD_DATABASE_URL to your production database URL');
  process.exit(1);
}

// Check if this is production database (only warn, don't block if FORCE_RUN is set)
const isProduction = dbUrl.includes('production') || 
                     dbUrl.includes('prod') || 
                     process.env.NODE_ENV === 'production' ||
                     process.env.PROD_DATABASE_URL !== undefined;

if (!isProduction && !process.env.FORCE_RUN) {
  console.warn('⚠️  WARNING: This script is designed for PRODUCTION database');
  console.warn('   Current DATABASE_URL does not appear to be production');
  console.warn('   Set FORCE_RUN=true to override this check');
  console.warn('   Or use PROD_DATABASE_URL environment variable');
  // Don't exit in CI - let it run if FORCE_RUN is set in workflow
  if (!process.env.CI) {
    process.exit(1);
  }
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl
    }
  }
});

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-d');
const skipVerification = args.includes('--skip-verification') || args.includes('-s');

interface ServiceStats {
  created: number;
  updated: number;
  skipped: number;
  errors: number;
}

async function ensureProductionServices() {
  console.log('🔧 Ensuring Production Services Exist\n');
  console.log('='.repeat(70) + '\n');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  const stats: ServiceStats = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0
  };

  try {
    // Step 1: Get or create Cleaning Services category
    console.log('📋 Step 1: Ensuring Cleaning Services Category Exists\n');
    
    let cleaningCategory = await prisma.serviceCategory.findFirst({
      where: { name: 'Cleaning Services' }
    });

    if (!cleaningCategory) {
      if (dryRun) {
        console.log('  [DRY RUN] Would create: Cleaning Services category');
        stats.created++;
      } else {
        cleaningCategory = await prisma.serviceCategory.create({
          data: {
            name: 'Cleaning Services',
            description: 'Professional cleaning services for homes and offices',
            icon: '🧹',
            isActive: true
          }
        });
        console.log(`  ✅ Created: Cleaning Services category (ID: ${cleaningCategory.id})`);
        stats.created++;
      }
    } else {
      console.log(`  ✅ Found: Cleaning Services category (ID: ${cleaningCategory.id})`);
      stats.skipped++;
    }

    // Step 2: Get or create Beauty & Personal Care category
    console.log('\n📋 Step 2: Ensuring Beauty & Personal Care Category Exists\n');
    
    let beautyCategory = await prisma.serviceCategory.findFirst({
      where: { name: 'Beauty & Personal Care' }
    });

    if (!beautyCategory) {
      if (dryRun) {
        console.log('  [DRY RUN] Would create: Beauty & Personal Care category');
        stats.created++;
      } else {
        beautyCategory = await prisma.serviceCategory.create({
          data: {
            name: 'Beauty & Personal Care',
            description: 'Professional beauty and personal care services',
            icon: '💄',
            isActive: true
          }
        });
        console.log(`  ✅ Created: Beauty & Personal Care category (ID: ${beautyCategory.id})`);
        stats.created++;
      }
    } else {
      console.log(`  ✅ Found: Beauty & Personal Care category (ID: ${beautyCategory.id})`);
      stats.skipped++;
    }

    // Step 3: Handle service name fixes (rename old names to new names)
    console.log('\n📋 Step 3: Fixing Service Name Mismatches\n');
    
    const SERVICE_NAME_FIXES: Record<string, string> = {
      'House Cleaning': 'Standard House Cleaning', // Fix mismatch
    };
    
    for (const [oldName, newName] of Object.entries(SERVICE_NAME_FIXES)) {
      const oldService = await prisma.service.findFirst({
        where: {
          name: oldName,
          categoryId: cleaningCategory?.id
        },
        include: {
          providers: true,
          bookings: true
        }
      });
      
      if (oldService) {
        // Check if new name already exists
        const existingNewService = await prisma.service.findFirst({
          where: {
            name: newName,
            categoryId: cleaningCategory?.id
          }
        });
        
        if (existingNewService) {
          console.log(`  ⚠️  Service "${newName}" already exists, skipping rename of "${oldName}"`);
          // If old service has no relationships, delete it
          if (oldService.providers.length === 0 && oldService.bookings.length === 0) {
            if (!dryRun) {
              await prisma.service.delete({ where: { id: oldService.id } });
              console.log(`  ✅ Deleted duplicate service: "${oldName}"`);
            } else {
              console.log(`  [DRY RUN] Would delete duplicate service: "${oldName}"`);
            }
          }
        } else {
          // Get config service to update other fields too
          const configService = SERVICES.find(s => s.name === newName);
          
          if (configService) {
            if (dryRun) {
              console.log(`  [DRY RUN] Would rename "${oldName}" → "${newName}"`);
              stats.updated++;
            } else {
              await prisma.service.update({
                where: { id: oldService.id },
                data: {
                  name: newName,
                  description: configService.description,
                  basePrice: configService.basePrice,
                  isActive: configService.isActive,
                }
              });
              console.log(`  ✅ Renamed "${oldName}" → "${newName}"`);
              stats.updated++;
            }
          }
        }
      }
    }

    // Step 4: Remove invalid services (category names that shouldn't be services)
    console.log('\n📋 Step 4: Removing Invalid Services\n');
    
    const invalidServiceNames = ['Cleaning Services']; // Category names that shouldn't be services
    
    for (const invalidName of invalidServiceNames) {
      const invalidService = await prisma.service.findFirst({
        where: {
          name: invalidName,
          categoryId: cleaningCategory?.id
        },
        include: {
          providers: true,
          bookings: true
        }
      });

      if (invalidService) {
        const hasRelationships = invalidService.providers.length > 0 || invalidService.bookings.length > 0;
        
        if (hasRelationships) {
          console.log(`  ⚠️  Invalid service "${invalidName}" has relationships - deactivating instead of deleting`);
          if (!dryRun) {
            await prisma.service.update({
              where: { id: invalidService.id },
              data: {
                isActive: false,
                name: `${invalidName} (INVALID - DEACTIVATED)`
              }
            });
            console.log(`  ✅ Deactivated invalid service: "${invalidName}"`);
          } else {
            console.log(`  [DRY RUN] Would deactivate: "${invalidName}"`);
          }
        } else {
          console.log(`  🗑️  Removing invalid service: "${invalidName}"`);
          if (!dryRun) {
            await prisma.service.delete({
              where: { id: invalidService.id }
            });
            console.log(`  ✅ Deleted invalid service: "${invalidName}"`);
          } else {
            console.log(`  [DRY RUN] Would delete: "${invalidName}"`);
          }
        }
      } else {
        console.log(`  ✓ No invalid service: "${invalidName}"`);
      }
    }

    // Step 5: Ensure all services from config exist
    console.log('\n📋 Step 5: Ensuring All Services from config/services.ts Exist\n');
    console.log(`Total services in config: ${SERVICES.length}\n`);

    for (const serviceConfig of SERVICES) {
      const category = serviceConfig.category === 'CLEANING' ? cleaningCategory : beautyCategory;
      
      if (!category) {
        console.error(`  ❌ Category not found for service: ${serviceConfig.name}`);
        stats.errors++;
        continue;
      }

      // Find existing service by exact name match
      const existingService = await prisma.service.findFirst({
        where: {
          name: serviceConfig.name,
          categoryId: category.id
        }
      });

      if (!existingService) {
        // Service doesn't exist - create it
        if (dryRun) {
          console.log(`  [DRY RUN] Would create: "${serviceConfig.name}" (R${serviceConfig.basePrice})`);
          stats.created++;
        } else {
          try {
            const newService = await prisma.service.create({
              data: {
                name: serviceConfig.name,
                description: serviceConfig.description,
                basePrice: serviceConfig.basePrice,
                isActive: serviceConfig.isActive,
                categoryId: category.id,
              }
            });
            console.log(`  ✅ Created: "${serviceConfig.name}" (R${serviceConfig.basePrice})`);
            stats.created++;
          } catch (error) {
            console.error(`  ❌ Error creating "${serviceConfig.name}":`, error instanceof Error ? error.message : error);
            stats.errors++;
          }
        }
      } else {
        // Service exists - check if it needs updating
        const needsUpdate = 
          existingService.description !== serviceConfig.description ||
          existingService.basePrice !== serviceConfig.basePrice ||
          existingService.isActive !== serviceConfig.isActive ||
          existingService.categoryId !== category.id;

        if (needsUpdate) {
          if (dryRun) {
            console.log(`  [DRY RUN] Would update: "${serviceConfig.name}"`);
            stats.updated++;
          } else {
            try {
              await prisma.service.update({
                where: { id: existingService.id },
                data: {
                  description: serviceConfig.description,
                  basePrice: serviceConfig.basePrice,
                  isActive: serviceConfig.isActive,
                  categoryId: category.id,
                }
              });
              console.log(`  🔄 Updated: "${serviceConfig.name}"`);
              stats.updated++;
            } catch (error) {
              console.error(`  ❌ Error updating "${serviceConfig.name}":`, error instanceof Error ? error.message : error);
              stats.errors++;
            }
          }
        } else {
          console.log(`  ✓ Exists: "${serviceConfig.name}" (already in sync)`);
          stats.skipped++;
        }
      }
    }

    // Step 4: Remove invalid services (category names that shouldn't be services)
    console.log('\n📋 Step 4: Checking for Invalid Services\n');
    
    const invalidServiceNames = ['Cleaning Services']; // Category names that shouldn't be services
    
    for (const invalidName of invalidServiceNames) {
      const invalidService = await prisma.service.findFirst({
        where: {
          name: invalidName,
          category: {
            name: 'Cleaning Services'
          }
        },
        include: {
          providers: true,
          bookings: true
        }
      });

      if (invalidService) {
        const hasRelationships = invalidService.providers.length > 0 || invalidService.bookings.length > 0;
        
        if (hasRelationships) {
          console.log(`  ⚠️  Invalid service "${invalidName}" has relationships - deactivating instead of deleting`);
          if (!dryRun) {
            await prisma.service.update({
              where: { id: invalidService.id },
              data: {
                isActive: false,
                name: `${invalidName} (INVALID - DEACTIVATED)`
              }
            });
            console.log(`  ✅ Deactivated: "${invalidName}"`);
          } else {
            console.log(`  [DRY RUN] Would deactivate: "${invalidName}"`);
          }
        } else {
          console.log(`  🗑️  Removing invalid service: "${invalidName}"`);
          if (!dryRun) {
            await prisma.service.delete({
              where: { id: invalidService.id }
            });
            console.log(`  ✅ Deleted: "${invalidName}"`);
          } else {
            console.log(`  [DRY RUN] Would delete: "${invalidName}"`);
          }
        }
      } else {
        console.log(`  ✓ No invalid service: "${invalidName}"`);
      }
    }

    // Step 5: Verification
    if (!skipVerification) {
      console.log('\n📋 Step 5: Verifying Services\n');
      
      const finalServices = await prisma.service.findMany({
        where: {
          OR: [
            { categoryId: cleaningCategory?.id },
            { categoryId: beautyCategory?.id }
          ],
          isActive: true
        },
        include: { category: true },
        orderBy: { name: 'asc' }
      });

      const configServiceNames = new Set(SERVICES.map(s => s.name));
      const dbServiceNames = new Set(finalServices.map(s => s.name));

      const missingInDb = SERVICES.filter(s => !dbServiceNames.has(s.name));
      const extraInDb = finalServices.filter(s => !configServiceNames.has(s.name));

      if (missingInDb.length > 0) {
        console.log(`  ⚠️  Services in config but missing in database: ${missingInDb.length}`);
        missingInDb.forEach(s => console.log(`     - ${s.name}`));
      }

      if (extraInDb.length > 0) {
        console.log(`  ℹ️  Services in database but not in config: ${extraInDb.length}`);
        extraInDb.forEach(s => console.log(`     - ${s.name} (${s.category.name})`));
      }

      if (missingInDb.length === 0 && extraInDb.length === 0) {
        console.log('  ✅ All services are in sync!');
      }

      // Check Specialized Cleaning services specifically
      console.log('\n  Checking "Specialized Cleaning" services:');
      const specializedServices = ['Carpet Cleaning', 'Mobile Car Wash', 'Office Cleaning'];
      const cleaningServices = finalServices.filter(s => s.category.name === 'Cleaning Services');
      
      for (const expectedName of specializedServices) {
        const exists = cleaningServices.some(s => s.name === expectedName);
        if (exists) {
          console.log(`    ✅ ${expectedName}`);
        } else {
          console.log(`    ❌ ${expectedName} - MISSING`);
        }
      }
    }

    // Step 6: Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 SUMMARY\n');
    
    if (dryRun) {
      console.log('🔍 DRY RUN - No changes were made\n');
    } else {
      console.log('✅ Changes Applied:\n');
    }
    
    console.log(`   Created: ${stats.created}`);
    console.log(`   Updated: ${stats.updated}`);
    console.log(`   Skipped: ${stats.skipped}`);
    console.log(`   Errors: ${stats.errors}\n`);

    if (stats.errors > 0) {
      console.log('⚠️  Some errors occurred. Review the output above.');
      process.exit(1);
    }

    if (dryRun && (stats.created > 0 || stats.updated > 0)) {
      console.log('💡 To apply these changes, run without --dry-run flag:');
      console.log('   npm run ensure:production:services\n');
    } else if (!dryRun) {
      console.log('✨ All services are now in sync with config/services.ts!\n');
      console.log('📱 Next Steps:');
      console.log('   1. Verify in production UI after Vercel deployment');
      console.log('   2. Check that services appear in correct subcategories');
      console.log('   3. Run: npm run verify:production:frontend\n');
    }

    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

ensureProductionServices()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  });
