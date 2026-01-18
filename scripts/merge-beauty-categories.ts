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

async function mergeBeautyCategories() {
  console.log('🔄 Merging Beauty Services into Beauty & Personal Care...\n');

  try {
    // Find both categories
    const redundantCategory = await prisma.serviceCategory.findFirst({
      where: { name: 'Beauty Services' }
    });

    const correctCategory = await prisma.serviceCategory.findFirst({
      where: { name: 'Beauty & Personal Care' }
    });

    if (!redundantCategory) {
      console.log('✅ No redundant "Beauty Services" category found.');
      return;
    }

    if (!correctCategory) {
      console.error('❌ ERROR: "Beauty & Personal Care" category not found!');
      process.exit(1);
    }

    console.log(`📋 Found categories:`);
    console.log(`   - Redundant: ${redundantCategory.name} (${redundantCategory.id})`);
    console.log(`   - Correct: ${correctCategory.name} (${correctCategory.id})\n`);

    // Get all services from redundant category
    const redundantServices = await prisma.service.findMany({
      where: { categoryId: redundantCategory.id },
      include: {
        providers: true,
        bookings: true
      }
    });

    console.log(`📦 Found ${redundantServices.length} services in redundant category\n`);

    // Get all services from correct category
    const correctServices = await prisma.service.findMany({
      where: { categoryId: correctCategory.id }
    });

    let migratedProviders = 0;
    let deletedDuplicates = 0;
    let servicesToDelete: string[] = [];

    for (const redundantService of redundantServices) {
      // Find matching service in correct category by name
      const matchingService = correctServices.find(
        s => s.name.toLowerCase() === redundantService.name.toLowerCase()
      );

      if (matchingService) {
        console.log(`🔄 Processing: ${redundantService.name}`);
        console.log(`   - Found duplicate in correct category`);

        // Migrate provider relationships
        if (redundantService.providers.length > 0) {
          console.log(`   - Migrating ${redundantService.providers.length} provider relationships...`);
          
          for (const providerService of redundantService.providers) {
            // Check if provider already has this service in correct category
            const existingProviderService = await prisma.providerService.findFirst({
              where: {
                providerId: providerService.providerId,
                serviceId: matchingService.id
              }
            });

            if (existingProviderService) {
              // Update existing relationship
              await prisma.providerService.update({
                where: { id: existingProviderService.id },
                data: {
                  customRate: providerService.customRate || existingProviderService.customRate
                }
              });
              console.log(`     ✅ Updated existing provider relationship`);
            } else {
              // Create new relationship
              await prisma.providerService.create({
                data: {
                  providerId: providerService.providerId,
                  serviceId: matchingService.id,
                  customRate: providerService.customRate
                }
              });
              console.log(`     ✅ Created new provider relationship`);
              migratedProviders++;
            }

            // Delete old provider relationship
            await prisma.providerService.delete({
              where: { id: providerService.id }
            });
          }
        }

        // Check for bookings
        if (redundantService.bookings.length > 0) {
          console.log(`   ⚠️  Service has ${redundantService.bookings.length} bookings - keeping service for now`);
          // We'll keep the service but mark it as inactive
          await prisma.service.update({
            where: { id: redundantService.id },
            data: {
              isActive: false
            }
          });
          console.log(`   - Marked redundant service as inactive`);
        } else {
          // Safe to delete
          servicesToDelete.push(redundantService.id);
          deletedDuplicates++;
          console.log(`   ✅ Safe to delete (no bookings)`);
        }
      } else {
        // Service doesn't exist in correct category - migrate it
        console.log(`🔄 Migrating: ${redundantService.name} (no duplicate found)`);
        await prisma.service.update({
          where: { id: redundantService.id },
          data: {
            categoryId: correctCategory.id
          }
        });
        console.log(`   ✅ Migrated to correct category`);
      }
    }

    // Delete duplicate services
    if (servicesToDelete.length > 0) {
      console.log(`\n🗑️  Deleting ${servicesToDelete.length} duplicate services...`);
      await prisma.service.deleteMany({
        where: {
          id: { in: servicesToDelete }
        }
      });
      console.log(`   ✅ Deleted ${servicesToDelete.length} duplicates`);
    }

    // Check if category is now empty
    const remainingServices = await prisma.service.count({
      where: { categoryId: redundantCategory.id }
    });

    if (remainingServices === 0) {
      // Delete the redundant category
      await prisma.serviceCategory.delete({
        where: { id: redundantCategory.id }
      });
      console.log(`\n✅ Deleted redundant category: ${redundantCategory.name}`);
    } else {
      // Deactivate the category
      await prisma.serviceCategory.update({
        where: { id: redundantCategory.id },
        data: {
          isActive: false
        }
      });
      console.log(`\n⚠️  Category still has ${remainingServices} services (marked as inactive)`);
      console.log(`   These services may have active bookings. Review manually.`);
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
        services: {
          where: { isActive: true }
        }
      }
    });

    console.log(`\n📋 Beauty-related categories:`);
    finalCategories.forEach(cat => {
      console.log(`   - ${cat.name}: ${cat.services.length} active services (Active: ${cat.isActive})`);
    });

    const activeBeautyCategory = finalCategories.find(
      cat => cat.name === 'Beauty & Personal Care' && cat.isActive
    );

    if (activeBeautyCategory) {
      console.log(`\n✨ Success! "Beauty & Personal Care" is the only active beauty category.`);
      console.log(`   - Active services: ${activeBeautyCategory.services.length}`);
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Provider relationships migrated: ${migratedProviders}`);
    console.log(`   - Duplicate services deleted: ${deletedDuplicates}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

mergeBeautyCategories()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  });
