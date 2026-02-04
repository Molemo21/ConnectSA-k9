import { PrismaClient } from '@prisma/client';
import { SERVICES, BEAUTY_SUBCATEGORIES } from '../config/services';
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

async function verifyBeautySubcategories() {
  console.log('💄 Verifying Beauty Services Subcategories\n');
  console.log('='.repeat(60));

  try {
    // Get beauty services from config
    const configBeautyServices = SERVICES.filter(s => s.category === 'BEAUTY');
    console.log(`\n📋 Beauty Services in Config: ${configBeautyServices.length}`);
    configBeautyServices.forEach(s => console.log(`   - ${s.name}`));

    // Get beauty category from database
    const beautyCategory = await prisma.serviceCategory.findFirst({
      where: { name: 'Beauty & Personal Care' }
    });

    if (!beautyCategory) {
      console.error('\n❌ Beauty & Personal Care category not found in database');
      console.error('   Please run the beauty services setup script first');
      process.exit(1);
    }

    console.log(`\n✅ Found Beauty category: ${beautyCategory.name} (${beautyCategory.id})`);

    // Get beauty services from database
    const dbBeautyServices = await prisma.service.findMany({
      where: {
        categoryId: beautyCategory.id,
        isActive: true
      },
      orderBy: { name: 'asc' }
    });

    console.log(`\n📊 Beauty Services in Database: ${dbBeautyServices.length}`);
    dbBeautyServices.forEach(s => console.log(`   - ${s.name}`));

    // Verify subcategory matching
    console.log('\n🔍 Verifying Subcategory Matching:\n');

    let allMatched = true;
    const unmatchedServices: string[] = [];

    for (const [subcategoryName, serviceNames] of Object.entries(BEAUTY_SUBCATEGORIES)) {
      console.log(`📁 ${subcategoryName}:`);
      
      for (const serviceName of serviceNames) {
        // Check if service exists in database
        const dbService = dbBeautyServices.find(s => {
          const sName = s.name.toLowerCase();
          const searchName = serviceName.toLowerCase();
          return sName.includes(searchName) || searchName.includes(sName);
        });

        // Also check config
        const configService = configBeautyServices.find(s => {
          const sName = s.name.toLowerCase();
          const searchName = serviceName.toLowerCase();
          return sName.includes(searchName) || searchName.includes(sName);
        });

        if (dbService && configService) {
          console.log(`   ✅ ${serviceName} - Found in DB and Config`);
        } else if (configService && !dbService) {
          console.log(`   ⚠️  ${serviceName} - In Config but NOT in DB`);
          unmatchedServices.push(serviceName);
          allMatched = false;
        } else if (!configService) {
          console.log(`   ❌ ${serviceName} - NOT in Config`);
          allMatched = false;
        } else {
          console.log(`   ❌ ${serviceName} - NOT in DB`);
          unmatchedServices.push(serviceName);
          allMatched = false;
        }
      }
      console.log('');
    }

    // Check for services in DB/Config that aren't in any subcategory
    console.log('🔍 Services not in any subcategory:');
    const allSubcategoryServices = Object.values(BEAUTY_SUBCATEGORIES).flat();
    const orphanedServices = dbBeautyServices.filter(s => {
      return !allSubcategoryServices.some(subName => {
        const sName = s.name.toLowerCase();
        const searchName = subName.toLowerCase();
        return sName.includes(searchName) || searchName.includes(sName);
      });
    });

    if (orphanedServices.length > 0) {
      console.log('   ⚠️  Found services not assigned to any subcategory:');
      orphanedServices.forEach(s => console.log(`      - ${s.name}`));
      allMatched = false;
    } else {
      console.log('   ✅ All services are assigned to subcategories');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    if (allMatched && orphanedServices.length === 0) {
      console.log('✅ All beauty services are properly categorized!');
    } else {
      console.log('⚠️  Some issues found:');
      if (unmatchedServices.length > 0) {
        console.log(`   - ${unmatchedServices.length} services need to be added to database`);
      }
      if (orphanedServices.length > 0) {
        console.log(`   - ${orphanedServices.length} services need to be added to subcategories`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyBeautySubcategories()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  });
