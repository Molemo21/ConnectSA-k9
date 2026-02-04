import { PrismaClient } from '@prisma/client';
import { SERVICES, CLEANING_SUBCATEGORIES } from '../config/services';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
const envPath = resolve(process.cwd(), '.env');
config({ path: envPath });
const envProdPath = resolve(process.cwd(), '.env.production');
config({ path: envProdPath });
const envLocalPath = resolve(process.cwd(), '.env.local');
config({ path: envLocalPath });

const dbUrl = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ ERROR: DATABASE_URL or PROD_DATABASE_URL environment variable is required');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl
    }
  }
});

// Use subcategories from config/services.ts (single source of truth)
const EXPECTED_CLEANING_SUBCATEGORIES = CLEANING_SUBCATEGORIES;

async function verifyServiceNameSync() {
  console.log('🔍 Verifying Service Name Sync Between Config and Database\n');
  console.log('='.repeat(70) + '\n');

  try {
    // Step 1: Get all cleaning services from config (source of truth)
    const configCleaningServices = SERVICES.filter(s => s.category === 'CLEANING');
    console.log('📋 Step 1: Services in config/services.ts (Source of Truth)\n');
    configCleaningServices.forEach(s => {
      console.log(`   ✅ ${s.name} (R${s.basePrice})`);
    });
    console.log(`\n   Total: ${configCleaningServices.length} services\n`);

    // Step 2: Get all cleaning services from database
    const cleaningCategory = await prisma.serviceCategory.findFirst({
      where: { name: 'Cleaning Services' },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { name: 'asc' }
        }
      }
    });

    if (!cleaningCategory) {
      console.error('❌ Cleaning Services category not found in database');
      process.exit(1);
    }

    console.log('📋 Step 2: Services in Production Database\n');
    cleaningCategory.services.forEach(s => {
      console.log(`   ${s.name} (R${s.basePrice})`);
    });
    console.log(`\n   Total: ${cleaningCategory.services.length} services\n`);

    // Step 3: Compare config vs database
    console.log('📋 Step 3: Comparing Config vs Database\n');
    
    const configServiceNames = new Set(configCleaningServices.map(s => s.name));
    const dbServiceNames = new Set(cleaningCategory.services.map(s => s.name));
    
    let hasMismatches = false;

    // Check for services in config but not in database
    console.log('   Checking services in config but missing in database:\n');
    for (const configService of configCleaningServices) {
      if (!dbServiceNames.has(configService.name)) {
        console.error(`   ❌ "${configService.name}" is in config but NOT in database`);
        hasMismatches = true;
      } else {
        // Verify price matches
        const dbService = cleaningCategory.services.find(s => s.name === configService.name);
        if (dbService && dbService.basePrice !== configService.basePrice) {
          console.warn(`   ⚠️  "${configService.name}" price mismatch: Config R${configService.basePrice}, DB R${dbService.basePrice}`);
        }
      }
    }

    // Check for services in database but not in config
    console.log('\n   Checking services in database but not in config:\n');
    for (const dbService of cleaningCategory.services) {
      if (!configServiceNames.has(dbService.name)) {
        console.error(`   ❌ "${dbService.name}" is in database but NOT in config`);
        console.error(`      ⚠️  This service should be removed or added to config`);
        hasMismatches = true;
      }
    }

    // Step 4: Verify subcategory organization
    console.log('\n📋 Step 4: Verifying Subcategory Organization\n');
    
    console.log('   Expected subcategories (from config/services.ts):\n');
    for (const [subcategoryName, expectedServices] of Object.entries(EXPECTED_CLEANING_SUBCATEGORIES)) {
      console.log(`   📁 ${subcategoryName}:`);
      for (const serviceName of expectedServices) {
        const existsInDb = dbServiceNames.has(serviceName);
        const existsInConfig = configServiceNames.has(serviceName);
        
        if (existsInDb && existsInConfig) {
          console.log(`      ✅ ${serviceName}`);
        } else if (!existsInDb) {
          console.error(`      ❌ ${serviceName} - NOT in database`);
          hasMismatches = true;
        } else if (!existsInConfig) {
          console.error(`      ❌ ${serviceName} - NOT in config`);
          hasMismatches = true;
        }
      }
    }

    // Step 5: Check for problematic service names
    console.log('\n📋 Step 5: Checking for Problematic Service Names\n');
    
    const problematicNames = ['Cleaning Services']; // Category name, not a service
    for (const problemName of problematicNames) {
      if (dbServiceNames.has(problemName)) {
        console.error(`   ❌ "${problemName}" is a CATEGORY name, not a service name`);
        console.error(`      ⚠️  This service should be removed from database`);
        hasMismatches = true;
      }
    }

    // Step 6: Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 VERIFICATION SUMMARY\n');

    if (hasMismatches) {
      console.error('❌ MISMATCHES FOUND!\n');
      console.log('   Issues identified:');
      console.log('   1. Service names don\'t match between config and database');
      console.log('   2. Some services need to be added/removed/renamed');
      console.log('   3. Subcategory organization may be incorrect\n');
      
      console.log('🔧 FIX REQUIRED:');
      console.log('   1. Update database to match config/services.ts exactly');
      console.log('   2. Run: npm run sync:reference:apply');
      console.log('   3. Or manually update service names in database\n');
      
      process.exit(1);
    } else {
      console.log('✅ ALL SERVICES ARE IN SYNC!\n');
      console.log('   ✓ Config matches database');
      console.log('   ✓ All expected services exist');
      console.log('   ✓ No problematic service names');
      console.log('   ✓ Subcategory organization is correct\n');
      
      console.log('📋 NEXT: Verify ServiceSelection.tsx matches these service names\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyServiceNameSync()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  });
