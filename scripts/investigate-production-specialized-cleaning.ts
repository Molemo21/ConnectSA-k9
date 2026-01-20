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

if (!process.env.DATABASE_URL && !process.env.PROD_DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL or PROD_DATABASE_URL environment variable is required');
  console.error('   This script checks the PRODUCTION database');
  console.error('   Set PROD_DATABASE_URL to your production database URL');
  process.exit(1);
}

const dbUrl = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl
    }
  }
});

// Expected services in Specialized Cleaning (from ServiceSelection.tsx)
const EXPECTED_SPECIALIZED = ['Carpet Cleaning', 'Mobile Car Wash', 'Office Cleaning'];

async function investigateProductionSpecializedCleaning() {
  console.log('🔍 Investigating Production "Specialized Cleaning" Subcategory\n');
  console.log('='.repeat(70) + '\n');
  console.log('⚠️  Checking PRODUCTION database...\n');

  try {
    // Step 1: Get all cleaning services from production database
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
      console.error('❌ Cleaning Services category not found in production database');
      process.exit(1);
    }

    console.log('📋 Step 1: All Active Cleaning Services in Production Database\n');
    console.log(`Category: ${cleaningCategory.name} (ID: ${cleaningCategory.id})`);
    console.log(`Total Active Services: ${cleaningCategory.services.length}\n`);

    const dbServices = cleaningCategory.services;
    dbServices.forEach((service, index) => {
      console.log(`${index + 1}. "${service.name}"`);
      console.log(`   ID: ${service.id}`);
      console.log(`   Price: R${service.basePrice}`);
      console.log(`   Active: ${service.isActive}`);
      console.log(`   Created: ${service.createdAt}`);
      console.log('');
    });

    // Step 2: Check each expected service in Specialized Cleaning
    console.log('\n📋 Step 2: Checking Expected "Specialized Cleaning" Services\n');
    console.log('Expected services (from ServiceSelection.tsx):');
    EXPECTED_SPECIALIZED.forEach(s => console.log(`  - ${s}`));
    console.log('');

    const dbServiceNames = dbServices.map(s => s.name);
    const issues: Array<{ service: string; issue: string; fix: string }> = [];

    for (const expectedName of EXPECTED_SPECIALIZED) {
      console.log(`\nChecking: "${expectedName}"`);
      
      // Check for exact match
      const exactMatch = dbServiceNames.find(db => db === expectedName);
      
      // Check for case-insensitive match
      const caseInsensitiveMatch = dbServiceNames.find(db => 
        db.toLowerCase() === expectedName.toLowerCase()
      );
      
      // Check for partial match
      const partialMatches = dbServiceNames.filter(db => 
        db.toLowerCase().includes(expectedName.toLowerCase()) ||
        expectedName.toLowerCase().includes(db.toLowerCase())
      );

      if (exactMatch) {
        console.log(`  ✅ EXACT MATCH found: "${exactMatch}"`);
      } else if (caseInsensitiveMatch) {
        console.log(`  ⚠️  CASE MISMATCH found: "${caseInsensitiveMatch}"`);
        console.log(`     Expected: "${expectedName}"`);
        console.log(`     Found: "${caseInsensitiveMatch}"`);
        issues.push({
          service: expectedName,
          issue: `Case mismatch: "${caseInsensitiveMatch}"`,
          fix: `Rename "${caseInsensitiveMatch}" to "${expectedName}" in database`
        });
      } else if (partialMatches.length > 0) {
        console.log(`  ⚠️  PARTIAL MATCHES found:`);
        partialMatches.forEach(match => {
          console.log(`     - "${match}"`);
        });
        issues.push({
          service: expectedName,
          issue: `Partial match only: ${partialMatches.join(', ')}`,
          fix: `Rename or create exact service "${expectedName}" in database`
        });
      } else {
        console.log(`  ❌ NOT FOUND in database`);
        issues.push({
          service: expectedName,
          issue: 'Service does not exist in database',
          fix: `Create service "${expectedName}" in database`
        });
      }
    }

    // Step 3: Simulate frontend filtering logic
    console.log('\n📋 Step 3: Simulating Frontend Filtering Logic\n');
    console.log('Frontend filtering code:');
    console.log('```typescript');
    console.log('services.filter(service =>');
    console.log('  subcategoryServices.some(subName =>');
    console.log('    service.name.toLowerCase().includes(subName.toLowerCase()) ||');
    console.log('    subName.toLowerCase().includes(service.name.toLowerCase())');
    console.log('  )');
    console.log(');');
    console.log('```\n');

    console.log('Testing filtering with current database services:\n');
    
    const filteredServices = dbServices.filter(service => {
      return EXPECTED_SPECIALIZED.some(expectedName => {
        const serviceNameLower = service.name.toLowerCase();
        const expectedNameLower = expectedName.toLowerCase();
        const matches = serviceNameLower.includes(expectedNameLower) ||
                        expectedNameLower.includes(serviceNameLower);
        return matches;
      });
    });

    console.log(`Services that would appear in "Specialized Cleaning" UI: ${filteredServices.length}\n`);
    filteredServices.forEach(s => {
      const matchedExpected = EXPECTED_SPECIALIZED.find(e => {
        const sLower = s.name.toLowerCase();
        const eLower = e.toLowerCase();
        return sLower.includes(eLower) || eLower.includes(sLower);
      });
      console.log(`  ✅ "${s.name}" (matched with expected: "${matchedExpected}")`);
    });

    const missing = EXPECTED_SPECIALIZED.filter(expected => 
      !filteredServices.some(fs => {
        const fsLower = fs.name.toLowerCase();
        const expectedLower = expected.toLowerCase();
        return fsLower.includes(expectedLower) || expectedLower.includes(fsLower);
      })
    );

    if (missing.length > 0) {
      console.log(`\n  ❌ Services NOT appearing in UI:`);
      missing.forEach(m => console.log(`     - ${m}`));
    }

    // Step 4: Check config/services.ts
    console.log('\n📋 Step 4: Comparing with config/services.ts (Source of Truth)\n');
    const configCleaningServices = SERVICES.filter(s => s.category === 'CLEANING');
    const configServiceNames = configCleaningServices.map(s => s.name);
    
    console.log('Services in config/services.ts:');
    configCleaningServices.forEach(s => {
      const inDb = dbServiceNames.includes(s.name);
      const inSpecialized = EXPECTED_SPECIALIZED.includes(s.name);
      
      let status = '';
      if (!inDb) status = '❌ NOT IN DB';
      else if (!inSpecialized) status = '⚠️  NOT IN SUBCATEGORY';
      else status = '✅';
      
      console.log(`  ${status} "${s.name}"`);
    });

    // Step 5: Detailed analysis
    console.log('\n📋 Step 5: Detailed Analysis\n');
    
    // Check Mobile Car Wash specifically
    console.log('Analyzing "Mobile Car Wash":');
    const mobileCarWashVariations = dbServices.filter(s => 
      s.name.toLowerCase().includes('mobile') || 
      s.name.toLowerCase().includes('car') ||
      s.name.toLowerCase().includes('wash')
    );
    
    if (mobileCarWashVariations.length > 0) {
      console.log('  Found potential matches:');
      mobileCarWashVariations.forEach(s => {
        console.log(`    - "${s.name}"`);
        console.log(`      Exact match: ${s.name === 'Mobile Car Wash'}`);
        console.log(`      Case match: ${s.name.toLowerCase() === 'mobile car wash'}`);
      });
    } else {
      console.log('  ❌ No variations found in database');
    }

    // Check Office Cleaning specifically
    console.log('\nAnalyzing "Office Cleaning":');
    const officeCleaningVariations = dbServices.filter(s => 
      s.name.toLowerCase().includes('office')
    );
    
    if (officeCleaningVariations.length > 0) {
      console.log('  Found potential matches:');
      officeCleaningVariations.forEach(s => {
        console.log(`    - "${s.name}"`);
        console.log(`      Exact match: ${s.name === 'Office Cleaning'}`);
        console.log(`      Case match: ${s.name.toLowerCase() === 'office cleaning'}`);
      });
    } else {
      console.log('  ❌ No variations found in database');
    }

    // Step 6: Summary and recommendations
    console.log('\n' + '='.repeat(70));
    console.log('📊 INVESTIGATION SUMMARY\n');

    if (issues.length === 0) {
      console.log('✅ ALL SERVICES EXIST AND MATCH!\n');
      console.log('If services still don\'t show in UI:');
      console.log('   1. Check Vercel deployment - ensure latest code is deployed');
      console.log('   2. Clear browser cache (hard refresh: Ctrl+Shift+R)');
      console.log('   3. Check browser console for JavaScript errors');
      console.log('   4. Verify API endpoint returns correct data');
    } else {
      console.log('❌ ISSUES FOUND:\n');
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. "${issue.service}"`);
        console.log(`   Issue: ${issue.issue}`);
        console.log(`   Fix: ${issue.fix}\n`);
      });

      console.log('🔧 RECOMMENDED ACTIONS:\n');
      
      const missingServices = issues.filter(i => i.issue.includes('NOT FOUND'));
      const nameMismatches = issues.filter(i => i.issue.includes('mismatch') || i.issue.includes('Partial'));

      if (missingServices.length > 0) {
        console.log('1. Create missing services in database:');
        console.log('   - Run CI/CD pipeline (will sync from dev to prod)');
        console.log('   - Or manually create services matching config/services.ts');
        console.log('');
      }

      if (nameMismatches.length > 0) {
        console.log('2. Fix service name mismatches:');
        console.log('   - Run: npm run fix:service:names (with PROD_DATABASE_URL)');
        console.log('   - Or manually rename services in database');
        console.log('');
      }

      console.log('3. After fixing database:');
      console.log('   - Run this script again to verify');
      console.log('   - Check production UI after Vercel deployment');
      console.log('   - Clear browser cache');
      console.log('');
    }

    // Step 7: API simulation
    console.log('📋 Step 6: Simulating API Response\n');
    console.log('What the frontend receives from /api/service-categories:\n');
    
    const apiResponse = {
      id: cleaningCategory.id,
      name: cleaningCategory.name,
      services: cleaningCategory.services.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        basePrice: s.basePrice
      }))
    };

    console.log(`Category: ${apiResponse.name}`);
    console.log(`Services (${apiResponse.services.length}):`);
    apiResponse.services.forEach(s => {
      console.log(`  - ${s.name} (R${s.basePrice})`);
    });

    console.log('\n' + '='.repeat(70) + '\n');

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

investigateProductionSpecializedCleaning()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  });
