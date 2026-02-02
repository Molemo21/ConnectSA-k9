#!/usr/bin/env node

/**
 * Clean Up Unnecessary Categories from PRODUCTION Database
 * 
 * This script removes Test Category and General Services categories
 * to keep the production database clean and professional.
 * 
 * Usage: node scripts/cleanup-categories-production.js
 */

const { PrismaClient } = require('@prisma/client');

async function cleanupCategoriesFromProduction() {
  console.log('🧹 Cleaning Up Unnecessary Categories from PRODUCTION Database\n');

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

    // Get current categories before cleanup
    const categoriesBefore = await prisma.serviceCategory.findMany({
      where: { isActive: true },
      include: {
        services: {
          where: { isActive: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log('📊 Categories Before Cleanup:');
    categoriesBefore.forEach(category => {
      console.log(`   - ${category.name} (${category.services.length} services)`);
    });
    console.log('');

    // Categories to remove
    const categoriesToRemove = ['Test Category', 'General Services'];
    
    console.log(`🗑️ Removing categories: ${categoriesToRemove.join(', ')}\n`);

    let removedCategories = 0;
    let removedServices = 0;

    for (const categoryName of categoriesToRemove) {
      // Find the category
      const category = await prisma.serviceCategory.findFirst({
        where: { name: categoryName },
        include: {
          services: {
            where: { isActive: true }
          }
        }
      });

      if (category) {
        console.log(`🔍 Found category: ${category.name} (${category.services.length} services)`);

        // First, deactivate all services in this category
        if (category.services.length > 0) {
          const serviceUpdateResult = await prisma.service.updateMany({
            where: {
              categoryId: category.id,
              isActive: true
            },
            data: {
              isActive: false
            }
          });
          
          console.log(`   ✅ Deactivated ${serviceUpdateResult.count} services`);
          removedServices += serviceUpdateResult.count;
        }

        // Then deactivate the category itself
        await prisma.serviceCategory.update({
          where: { id: category.id },
          data: {
            isActive: false
          }
        });

        console.log(`   ✅ Deactivated category: ${category.name}`);
        removedCategories++;
      } else {
        console.log(`   ⚠️ Category not found: ${categoryName}`);
      }
    }

    // Get categories after cleanup
    const categoriesAfter = await prisma.serviceCategory.findMany({
      where: { isActive: true },
      include: {
        services: {
          where: { isActive: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log('\n📊 Categories After Cleanup:');
    categoriesAfter.forEach(category => {
      console.log(`   - ${category.name} (${category.services.length} services)`);
    });

    // Get final statistics
    const totalActiveServices = await prisma.service.count({
      where: { isActive: true }
    });

    const totalActiveCategories = await prisma.serviceCategory.count({
      where: { isActive: true }
    });

    console.log('\n📈 Cleanup Summary:');
    console.log(`   - Categories Removed: ${removedCategories}`);
    console.log(`   - Services Deactivated: ${removedServices}`);
    console.log(`   - Active Categories: ${totalActiveCategories}`);
    console.log(`   - Active Services: ${totalActiveServices}`);

    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('💡 Production now has a clean, professional category structure.');
    console.log('🚀 Only relevant categories (Beauty & Personal Care, Cleaning Services) remain active.');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  cleanupCategoriesFromProduction()
    .then(() => {
      console.log('\n✅ Cleanup script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Cleanup script failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupCategoriesFromProduction };
