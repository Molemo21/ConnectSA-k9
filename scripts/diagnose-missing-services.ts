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

if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is required');
  console.error('   Set DATABASE_URL or PROD_DATABASE_URL to production database URL');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Use subcategories from config/services.ts (single source of truth)
const EXPECTED_SUBCATEGORIES = CLEANING_SUBCATEGORIES;

async function diagnoseMissingServices() {
  console.log('🔍 Diagnosing Missing Services in Production UI\n');
  console.log('='.repeat(70) + '\n');

  try {
    // Step 1: Get all cleaning services from database
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
      console.error('❌ Cleaning Services category not found');
      process.exit(1);
    }

    console.log('📋 Step 1: Services in Production Database\n');
    const dbServices = cleaningCategory.services;
    console.log(`Total Active Services: ${dbServices.length}\n`);
    
    dbServices.forEach((service, index) => {
      console.log(`${index + 1}. "${service.name}"`);
      console.log(`   ID: ${service.id}`);
      console.log(`   Price: R${service.basePrice}`);
      console.log(`   Active: ${service.isActive}\n`);
    });

    // Step 2: Check each expected service
    console.log('\n📋 Step 2: Checking Expected Services\n');
    
    const allExpectedServices = Object.values(EXPECTED_SUBCATEGORIES).flat();
    const dbServiceNames = dbServices.map(s => s.name);
    
    console.log('Checking if expected services exist in database:\n');
    for (const expectedName of allExpectedServices) {
      // Check for exact match
      const exactMatch = dbServiceNames.find(db => db === expectedName);
      
      // Check for partial match (case-insensitive)
      const partialMatches = dbServiceNames.filter(db => 
        db.toLowerCase().includes(expectedName.toLowerCase()) ||
        expectedName.toLowerCase().includes(db.toLowerCase())
      );

      if (exactMatch) {
        console.log(`  ✅ "${expectedName}" - EXACT MATCH`);
      } else if (partialMatches.length > 0) {
        console.log(`  ⚠️  "${expectedName}" - PARTIAL MATCHES FOUND:`);
        partialMatches.forEach(match => {
          console.log(`     - "${match}"`);
          console.log(`     ⚠️  Name mismatch! Frontend filtering may fail.`);
        });
      } else {
        console.log(`  ❌ "${expectedName}" - NOT FOUND in database`);
        console.log(`     💡 This service needs to be created in the database.`);
      }
    }

    // Step 3: Check subcategory filtering logic
    console.log('\n📋 Step 3: Testing Subcategory Filtering Logic\n');
    
    for (const [subcategoryName, expectedServices] of Object.entries(EXPECTED_SUBCATEGORIES)) {
      console.log(`\nSubcategory: "${subcategoryName}"`);
      console.log(`Expected services: ${expectedServices.join(', ')}\n`);
      
      // Simulate the frontend filtering logic
      const filteredServices = dbServices.filter(service => {
        return expectedServices.some(expectedName => {
          const serviceNameLower = service.name.toLowerCase();
          const expectedNameLower = expectedName.toLowerCase();
          return serviceNameLower.includes(expectedNameLower) ||
                 expectedNameLower.includes(serviceNameLower);
        });
      });

      console.log(`Services that would appear in UI: ${filteredServices.length}`);
      filteredServices.forEach(s => console.log(`  ✅ ${s.name}`));
      
      const missing = expectedServices.filter(expected => 
        !filteredServices.some(fs => 
          fs.name.toLowerCase().includes(expected.toLowerCase()) ||
          expected.toLowerCase().includes(fs.name.toLowerCase())
        )
      );
      
      if (missing.length > 0) {
        console.log(`\n  ❌ Missing from UI (not in database or name mismatch):`);
        missing.forEach(m => console.log(`     - ${m}`));
      }
    }

    // Step 4: Check config services
    console.log('\n📋 Step 4: Comparing with config/services.ts\n');
    const configCleaningServices = SERVICES.filter(s => s.category === 'CLEANING');
    const configServiceNames = configCleaningServices.map(s => s.name);
    
    console.log(`Services in config: ${configCleaningServices.length}`);
    configCleaningServices.forEach(s => {
      const inDb = dbServiceNames.includes(s.name);
      const inSubcategory = allExpectedServices.includes(s.name);
      
      let status = '✅';
      if (!inDb) status = '❌ NOT IN DB';
      else if (!inSubcategory) status = '⚠️  NOT IN SUBCATEGORY';
      
      console.log(`  ${status} ${s.name}`);
    });

    // Step 5: Summary and recommendations
    console.log('\n' + '='.repeat(70));
    console.log('📊 DIAGNOSIS SUMMARY\n');

    const issues: string[] = [];

    // Check Mobile Car Wash
    const mobileCarWash = dbServices.find(s => 
      s.name.toLowerCase().includes('mobile') && 
      s.name.toLowerCase().includes('car')
    );
    if (!mobileCarWash) {
      issues.push('❌ "Mobile Car Wash" NOT FOUND in database');
    } else if (mobileCarWash.name !== 'Mobile Car Wash') {
      issues.push(`⚠️  "Mobile Car Wash" name mismatch: Database has "${mobileCarWash.name}"`);
    }

    // Check Office Cleaning
    const officeCleaning = dbServices.find(s => 
      s.name.toLowerCase().includes('office') && 
      s.name.toLowerCase().includes('cleaning')
    );
    if (!officeCleaning) {
      issues.push('❌ "Office Cleaning" NOT FOUND in database');
    } else if (officeCleaning.name !== 'Office Cleaning') {
      issues.push(`⚠️  "Office Cleaning" name mismatch: Database has "${officeCleaning.name}"`);
    }

    if (issues.length > 0) {
      console.log('🔧 ISSUES FOUND:\n');
      issues.forEach(issue => console.log(`   ${issue}`));
      console.log('\n💡 RECOMMENDATIONS:\n');
      
      if (!mobileCarWash || mobileCarWash.name !== 'Mobile Car Wash') {
        console.log('1. Fix "Mobile Car Wash":');
        if (mobileCarWash) {
          console.log(`   - Rename "${mobileCarWash.name}" to "Mobile Car Wash" in database`);
        } else {
          console.log('   - Create "Mobile Car Wash" service in database');
          console.log('   - Run: npm run sync:reference:apply (in CI/CD)');
        }
        console.log('');
      }

      if (!officeCleaning || officeCleaning.name !== 'Office Cleaning') {
        console.log('2. Fix "Office Cleaning":');
        if (officeCleaning) {
          console.log(`   - Rename "${officeCleaning.name}" to "Office Cleaning" in database`);
        } else {
          console.log('   - Create "Office Cleaning" service in database');
          console.log('   - Run: npm run sync:reference:apply (in CI/CD)');
        }
        console.log('');
      }

      console.log('3. After fixing database, verify:');
      console.log('   - Run this script again to confirm services exist');
      console.log('   - Check production UI after Vercel deployment');
      console.log('');
    } else {
      console.log('✅ ALL SERVICES ARE CORRECT!\n');
      console.log('If services still don\'t show in UI:');
      console.log('   1. Check Vercel deployment status');
      console.log('   2. Clear browser cache (hard refresh)');
      console.log('   3. Verify frontend code is deployed\n');
    }

    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseMissingServices()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  });
