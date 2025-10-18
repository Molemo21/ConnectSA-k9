#!/usr/bin/env node

/**
 * Consolidate Duplicate Cleaning Categories in PRODUCTION Database
 * 
 * This script consolidates duplicate "Cleaning Services" categories
 * by moving all services to the main category and removing the empty one.
 * 
 * Usage: node scripts/consolidate-cleaning-categories-production.js
 */

const { PrismaClient } = require('@prisma/client');

async function consolidateCleaningCategoriesInProduction() {
  console.log('🔄 Consolidating Duplicate Cleaning Categories in PRODUCTION Database\n');

  // Use production database URL
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    await prisma.$connect();
    console.log('✅ PRODUCTION Database connection successful\n');

    // Find all "Cleaning Services" categories
    const cleaningCategories = await prisma.serviceCategory.findMany({
      where: { 
        name: 'Cleaning Services',
        isActive: true 
      },
      include: {
        services: {
          where: { isActive: true }
        }
      },
      orderBy: { createdAt: 'asc' } // Oldest first
    });

    console.log(`🔍 Found ${cleaningCategories.length} "Cleaning Services" categories:`);
    cleaningCategories.forEach((category, index) => {
      console.log(`   ${index + 1}. ID: ${category.id} (${category.services.length} services)`);
    });

    if (cleaningCategories.length <= 1) {
      console.log('✅ No duplicate cleaning categories found. Nothing to consolidate.');
      return;
    }

    // Use the first (oldest) category as the main one
    const mainCategory = cleaningCategories[0];
    const duplicateCategories = cleaningCategories.slice(1);

    console.log(`\n🎯 Using main category: ${mainCategory.id} (${mainCategory.services.length} services)`);
    console.log(`🗑️ Consolidating ${duplicateCategories.length} duplicate categories...\n`);

    let movedServices = 0;
    let removedCategories = 0;

    for (const duplicateCategory of duplicateCategories) {
      console.log(`📦 Processing duplicate category: ${duplicateCategory.id} (${duplicateCategory.services.length} services)`);

      // Move all services from duplicate to main category
      if (duplicateCategory.services.length > 0) {
        const moveResult = await prisma.service.updateMany({
          where: {
            categoryId: duplicateCategory.id,
            isActive: true
          },
          data: {
            categoryId: mainCategory.id
          }
        });

        console.log(`   ✅ Moved ${moveResult.count} services to main category`);
        movedServices += moveResult.count;
      }

      // Deactivate the duplicate category
      await prisma.serviceCategory.update({
        where: { id: duplicateCategory.id },
        data: {
          isActive: false
        }
      });

      console.log(`   ✅ Deactivated duplicate category: ${duplicateCategory.id}`);
      removedCategories++;
    }

    // Verify final state
    const finalCleaningCategories = await prisma.serviceCategory.findMany({
      where: { 
        name: 'Cleaning Services',
        isActive: true 
      },
      include: {
        services: {
          where: { isActive: true }
        }
      }
    });

    const totalActiveServices = await prisma.service.count({
      where: { isActive: true }
    });

    const totalActiveCategories = await prisma.serviceCategory.count({
      where: { isActive: true }
    });

    console.log('\n📊 Final State:');
    console.log(`   - Active Cleaning Categories: ${finalCleaningCategories.length}`);
    finalCleaningCategories.forEach(category => {
      console.log(`     - ${category.id}: ${category.services.length} services`);
    });
    console.log(`   - Total Active Categories: ${totalActiveCategories}`);
    console.log(`   - Total Active Services: ${totalActiveServices}`);

    console.log('\n📈 Consolidation Summary:');
    console.log(`   - Services Moved: ${movedServices}`);
    console.log(`   - Categories Removed: ${removedCategories}`);

    console.log('\n🎉 Cleaning categories consolidation completed successfully!');
    console.log('💡 Production now has a clean, consolidated category structure.');
    console.log('🚀 Only one "Cleaning Services" category remains with all services.');

  } catch (error) {
    console.error('❌ Error during consolidation:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  consolidateCleaningCategoriesInProduction()
    .then(() => {
      console.log('\n✅ Consolidation script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Consolidation script failed:', error);
      process.exit(1);
    });
}

module.exports = { consolidateCleaningCategoriesInProduction };
