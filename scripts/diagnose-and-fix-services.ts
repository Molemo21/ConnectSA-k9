import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'path';

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

async function diagnoseAndFix() {
  console.log('🔍 Diagnosing services issue in development database...\n');

  try {
    // Step 1: Check categories
    console.log('📊 Step 1: Checking service categories...');
    const categories = await prisma.serviceCategory.findMany({
      include: {
        services: {
          where: { isActive: true }
        }
      }
    });
    
    console.log(`   Found ${categories.length} total categories`);
    categories.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.isActive ? '✅ active' : '❌ inactive'}) - ${cat.services.length} active services`);
    });

    // Step 2: Check all services
    console.log('\n📊 Step 2: Checking all services...');
    const allServices = await prisma.service.findMany({
      include: {
        category: true
      }
    });
    
    console.log(`   Found ${allServices.length} total services`);
    
    const servicesWithCategory = allServices.filter(s => s.categoryId && s.category);
    const servicesWithoutCategory = allServices.filter(s => !s.categoryId || !s.category);
    const inactiveServices = allServices.filter(s => !s.isActive);
    
    console.log(`   ✅ Services with valid category: ${servicesWithCategory.length}`);
    console.log(`   ❌ Services without category: ${servicesWithoutCategory.length}`);
    console.log(`   ⚠️  Inactive services: ${inactiveServices.length}`);

    // Step 3: Check what the API would return
    console.log('\n📊 Step 3: Checking what API would return...');
    const apiServices = await prisma.service.findMany({
      where: {
        isActive: true,
        category: {
          isActive: true
        }
      },
      include: {
        category: true
      }
    });
    
    console.log(`   🚨 API would return: ${apiServices.length} services`);
    
    if (apiServices.length === 0) {
      console.log('\n❌ CRITICAL: No services would be returned by the API!');
      console.log('   This is why services are not appearing in the app.\n');
    } else {
      console.log('\n✅ API would return services:');
      apiServices.forEach(s => {
        console.log(`   - ${s.name} (Category: ${s.category?.name || 'N/A'})`);
      });
    }

    // Step 4: Fix the issues
    if (categories.length === 0 || servicesWithoutCategory.length > 0 || apiServices.length === 0) {
      console.log('\n🔧 Step 4: Fixing issues...\n');
      
      // Create cleaning category if it doesn't exist
      let cleaningCategory = await prisma.serviceCategory.findFirst({
        where: { name: 'Cleaning Services' }
      });
      
      if (!cleaningCategory) {
        cleaningCategory = await prisma.serviceCategory.create({
          data: {
            id: 'cat_cleaning',
            name: 'Cleaning Services',
            description: 'Professional cleaning services for homes and offices',
            icon: '🧹',
            isActive: true
          }
        });
        console.log('✅ Created "Cleaning Services" category');
      } else {
        // Ensure it's active
        if (!cleaningCategory.isActive) {
          cleaningCategory = await prisma.serviceCategory.update({
            where: { id: cleaningCategory.id },
            data: { isActive: true }
          });
          console.log('✅ Activated "Cleaning Services" category');
        } else {
          console.log('✅ "Cleaning Services" category already exists and is active');
        }
      }
      
      // Fix services without category
      if (servicesWithoutCategory.length > 0) {
        let fixed = 0;
        for (const service of servicesWithoutCategory) {
          await prisma.service.update({
            where: { id: service.id },
            data: {
              categoryId: cleaningCategory.id,
              isActive: true
            }
          });
          fixed++;
          console.log(`✅ Fixed service: ${service.name} (assigned to Cleaning Services)`);
        }
        console.log(`\n✅ Fixed ${fixed} services (assigned to category and activated)`);
      }
      
      // Activate inactive services that have categories
      const inactiveWithCategory = inactiveServices.filter(s => s.categoryId);
      if (inactiveWithCategory.length > 0) {
        for (const service of inactiveWithCategory) {
          await prisma.service.update({
            where: { id: service.id },
            data: { isActive: true }
          });
          console.log(`✅ Activated service: ${service.name}`);
        }
        console.log(`✅ Activated ${inactiveWithCategory.length} services`);
      }

      // Step 5: Verify the fix
      console.log('\n📊 Step 5: Verifying fix...');
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
      
      console.log(`\n✅ SUCCESS: API will now return ${finalServices.length} services:`);
      finalServices.forEach(s => {
        console.log(`   - ${s.name} (${s.category?.name}) - R${s.basePrice || 0}`);
      });
      
      if (finalServices.length === 0) {
        console.log('\n⚠️  WARNING: Still no services! Creating sample services...');
        
        // Create sample services
        const sampleServices = [
          {
            name: 'House Cleaning',
            description: 'Professional house cleaning services including dusting, vacuuming, and sanitizing',
            basePrice: 350.00,
          },
          {
            name: 'Window Cleaning',
            description: 'Interior and exterior window cleaning services',
            basePrice: 300.00,
          },
          {
            name: 'Deep Cleaning',
            description: 'Comprehensive deep cleaning for move-in/move-out or special occasions',
            basePrice: 600.00,
          },
          {
            name: 'Carpet Cleaning',
            description: 'Professional carpet and upholstery cleaning services',
            basePrice: 400.00,
          }
        ];
        
        for (const serviceData of sampleServices) {
          const existing = await prisma.service.findFirst({
            where: { name: serviceData.name }
          });
          
          if (!existing) {
            await prisma.service.create({
              data: {
                name: serviceData.name,
                description: serviceData.description,
                categoryId: cleaningCategory.id,
                basePrice: serviceData.basePrice,
                isActive: true
              }
            });
            console.log(`✅ Created sample service: ${serviceData.name}`);
          }
        }
        
        // Final verification
        const finalCheck = await prisma.service.count({
          where: {
            isActive: true,
            category: { isActive: true }
          }
        });
        console.log(`\n✅ Final count: ${finalCheck} services available`);
      }
    } else {
      console.log('\n✅ No fixes needed! Everything looks good.');
    }

    // Final summary
    console.log('\n📈 FINAL SUMMARY:');
    const finalCount = await prisma.service.count({
      where: {
        isActive: true,
        category: { isActive: true }
      }
    });
    const totalCategories = await prisma.serviceCategory.count({ where: { isActive: true } });
    
    console.log(`   ✅ Active categories: ${totalCategories}`);
    console.log(`   ✅ Services available via API: ${finalCount}`);
    
    if (finalCount > 0) {
      console.log('\n🎉 SUCCESS! Services should now appear in your app.');
      console.log('   Restart your dev server if it\'s running to see the changes.');
    } else {
      console.log('\n⚠️  WARNING: Still no services available. Check the database connection.');
    }

  } catch (error) {
    console.error('\n❌ Error during diagnosis/fix:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
diagnoseAndFix()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  });
