import { PrismaClient } from '@prisma/client';
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

async function removeRedundantBeautyCategory() {
  console.log('🔍 Checking for redundant Beauty Services category...\n');

  try {
    // Find all beauty-related categories
    const allCategories = await prisma.serviceCategory.findMany({
      where: {
        OR: [
          { name: { contains: 'Beauty', mode: 'insensitive' } },
          { name: { contains: 'Personal Care', mode: 'insensitive' } }
        ]
      },
      include: {
        services: {
          include: {
            bookings: true,
            providers: true
          }
        }
      }
    });

    console.log(`📋 Found ${allCategories.length} beauty-related categories:\n`);
    allCategories.forEach(cat => {
      console.log(`   - ${cat.name} (ID: ${cat.id})`);
      console.log(`     Services: ${cat.services.length}`);
      console.log(`     Active: ${cat.isActive}`);
      console.log('');
    });

    // Find the redundant "Beauty Services" category (without "& Personal Care")
    const redundantCategory = allCategories.find(
      cat => cat.name === 'Beauty Services' || cat.name === 'Beauty'
    );

    // Find the correct "Beauty & Personal Care" category
    const correctCategory = allCategories.find(
      cat => cat.name === 'Beauty & Personal Care'
    );

    if (!redundantCategory) {
      console.log('✅ No redundant "Beauty Services" category found.');
      console.log('   Only "Beauty & Personal Care" exists - nothing to remove.\n');
      
      if (correctCategory) {
        console.log(`✅ Keeping: ${correctCategory.name}`);
        console.log(`   - Services: ${correctCategory.services.length}`);
        console.log(`   - Active: ${correctCategory.isActive}`);
      }
      return;
    }

    if (!correctCategory) {
      console.error('❌ ERROR: "Beauty & Personal Care" category not found!');
      console.error('   Cannot migrate services. Please create it first.');
      process.exit(1);
    }

    console.log('⚠️  Found redundant category that needs to be removed:');
    console.log(`   - Name: ${redundantCategory.name}`);
    console.log(`   - ID: ${redundantCategory.id}`);
    console.log(`   - Services: ${redundantCategory.services.length}`);
    console.log('');

    // Check if services have active relationships
    const servicesWithBookings = redundantCategory.services.filter(
      s => s.bookings.length > 0
    );
    const servicesWithProviders = redundantCategory.services.filter(
      s => s.providers.length > 0
    );

    if (servicesWithBookings.length > 0 || servicesWithProviders.length > 0) {
      console.log('⚠️  WARNING: Some services have active relationships:');
      if (servicesWithBookings.length > 0) {
        console.log(`   - ${servicesWithBookings.length} services have bookings`);
        servicesWithBookings.forEach(s => {
          console.log(`     * ${s.name}: ${s.bookings.length} bookings`);
        });
      }
      if (servicesWithProviders.length > 0) {
        console.log(`   - ${servicesWithProviders.length} services have providers`);
        servicesWithProviders.forEach(s => {
          console.log(`     * ${s.name}: ${s.providers.length} providers`);
        });
      }
      console.log('');
      console.log('🔄 Strategy: Migrate services to "Beauty & Personal Care" instead of deleting');
      console.log('');

      // Migrate services to correct category
      let migrated = 0;
      let skipped = 0;

      for (const service of redundantCategory.services) {
        // Check if service already exists in correct category
        const existingInCorrect = await prisma.service.findFirst({
          where: {
            name: service.name,
            categoryId: correctCategory.id
          }
        });

        if (existingInCorrect) {
          console.log(`⏭️  Skipping ${service.name} - already exists in correct category`);
          skipped++;
          
          // If this service has relationships, we should keep it but mark as inactive
          // or merge the relationships
          if (service.bookings.length > 0 || service.providers.length > 0) {
            console.log(`   ⚠️  Service has relationships - keeping both for now`);
          }
        } else {
          // Migrate service to correct category
          await prisma.service.update({
            where: { id: service.id },
            data: {
              categoryId: correctCategory.id
            }
          });
          console.log(`✅ Migrated: ${service.name}`);
          migrated++;
        }
      }

      console.log(`\n📊 Migration Summary:`);
      console.log(`   - Migrated: ${migrated}`);
      console.log(`   - Skipped (duplicates): ${skipped}`);
      console.log('');

      // Now check if we can safely delete the redundant category
      const remainingServices = await prisma.service.count({
        where: { categoryId: redundantCategory.id }
      });

      if (remainingServices > 0) {
        console.log(`⚠️  ${remainingServices} services still in redundant category`);
        console.log('   These may be duplicates or have conflicting names.');
        console.log('   Review manually before deletion.');
      } else {
        console.log('✅ All services migrated. Safe to delete redundant category.');
      }
    } else {
      console.log('✅ No active relationships found. Safe to migrate/delete.');
      console.log('');

      // Migrate all services to correct category
      let migrated = 0;
      for (const service of redundantCategory.services) {
        // Check if duplicate exists
        const existing = await prisma.service.findFirst({
          where: {
            name: service.name,
            categoryId: correctCategory.id
          }
        });

        if (existing) {
          console.log(`⏭️  Skipping ${service.name} - duplicate in correct category`);
          // Delete the duplicate from redundant category
          await prisma.service.delete({
            where: { id: service.id }
          });
        } else {
          await prisma.service.update({
            where: { id: service.id },
            data: {
              categoryId: correctCategory.id
            }
          });
          console.log(`✅ Migrated: ${service.name}`);
          migrated++;
        }
      }

      console.log(`\n📊 Migration Summary:`);
      console.log(`   - Migrated: ${migrated}`);
      console.log(`   - Deleted duplicates: ${redundantCategory.services.length - migrated}`);
    }

    // Delete the redundant category if it has no services
    const finalServiceCount = await prisma.service.count({
      where: { categoryId: redundantCategory.id }
    });

    if (finalServiceCount === 0) {
      await prisma.serviceCategory.delete({
        where: { id: redundantCategory.id }
      });
      console.log(`\n✅ Deleted redundant category: ${redundantCategory.name}`);
    } else {
      console.log(`\n⚠️  Cannot delete category - ${finalServiceCount} services still exist`);
      console.log('   Please review and migrate/delete remaining services manually.');
    }

    // Final verification
    console.log('\n🔍 Final Verification:');
    const finalCategories = await prisma.serviceCategory.findMany({
      where: {
        OR: [
          { name: { contains: 'Beauty', mode: 'insensitive' } },
          { name: { contains: 'Personal Care', mode: 'insensitive' } }
        ]
      },
      include: {
        services: true
      }
    });

    console.log(`\n📋 Remaining beauty-related categories: ${finalCategories.length}`);
    finalCategories.forEach(cat => {
      console.log(`   - ${cat.name}: ${cat.services.length} services`);
    });

    if (finalCategories.length === 1 && finalCategories[0].name === 'Beauty & Personal Care') {
      console.log('\n✨ Success! Only "Beauty & Personal Care" category remains.');
    } else {
      console.log('\n⚠️  Multiple beauty categories still exist. Review needed.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

removeRedundantBeautyCategory()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  });
