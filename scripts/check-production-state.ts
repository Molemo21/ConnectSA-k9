import { PrismaClient } from '@prisma/client';
import { SERVICES } from '../config/services';
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
  console.error('   This script checks the PRODUCTION database state');
  console.error('   Set DATABASE_URL to your production database URL');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function checkProductionState() {
  console.log('🔍 Checking Production Database State\n');
  console.log('='.repeat(60));

  try {
    // 1. Check categories
    console.log('\n📋 Step 1: Checking Service Categories\n');
    const categories = await prisma.serviceCategory.findMany({
      where: { isActive: true },
      include: {
        services: {
          where: { isActive: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log(`Found ${categories.length} active categories:\n`);
    categories.forEach(cat => {
      console.log(`  📁 ${cat.name} (${cat.icon || 'N/A'})`);
      console.log(`     Services: ${cat.services.length}`);
      cat.services.forEach(s => {
        console.log(`       - ${s.name} (R${s.basePrice || 0})`);
      });
      console.log('');
    });

    // Check for expected categories
    const expectedCategories = ['Cleaning Services', 'Beauty & Personal Care'];
    const missingCategories: string[] = [];
    
    expectedCategories.forEach(expected => {
      const found = categories.find(c => c.name === expected);
      if (!found) {
        missingCategories.push(expected);
        console.log(`  ❌ Missing category: ${expected}`);
      } else {
        console.log(`  ✅ Found category: ${expected}`);
      }
    });

    // Check for redundant categories
    const redundantCategories = categories.filter(c => 
      c.name === 'Beauty Services' || c.name === 'Beauty'
    );
    if (redundantCategories.length > 0) {
      console.log(`\n  ⚠️  Found redundant categories:`);
      redundantCategories.forEach(c => {
        console.log(`       - ${c.name} (${c.services.length} services)`);
      });
    }

    // 2. Check specific services
    console.log('\n📋 Step 2: Checking Key Services\n');
    
    const allServices = await prisma.service.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { name: 'asc' }
    });

    // Check Mobile Car Wash
    const mobileCarWash = allServices.find(s => 
      s.name.toLowerCase().includes('car wash') || 
      s.name.toLowerCase().includes('mobile car wash')
    );
    if (mobileCarWash) {
      console.log(`  ✅ Mobile Car Wash: Found`);
      console.log(`     Category: ${mobileCarWash.category.name}`);
      console.log(`     Price: R${mobileCarWash.basePrice || 0}`);
    } else {
      console.log(`  ❌ Mobile Car Wash: MISSING`);
    }

    // Check beauty services count
    const beautyCategory = categories.find(c => c.name === 'Beauty & Personal Care');
    const expectedBeautyServices = 11;
    if (beautyCategory) {
      const beautyServices = allServices.filter(s => s.categoryId === beautyCategory.id);
      console.log(`\n  Beauty & Personal Care Services:`);
      console.log(`     Expected: ${expectedBeautyServices}`);
      console.log(`     Found: ${beautyServices.length}`);
      if (beautyServices.length === expectedBeautyServices) {
        console.log(`     ✅ All beauty services present`);
      } else {
        console.log(`     ⚠️  Missing ${expectedBeautyServices - beautyServices.length} services`);
      }
      beautyServices.forEach(s => {
        console.log(`       - ${s.name}`);
      });
    } else {
      console.log(`  ❌ Beauty & Personal Care category: MISSING`);
    }

    // 3. Compare with config
    console.log('\n📋 Step 3: Comparing with config/services.ts\n');
    const configServiceNames = new Set(SERVICES.map(s => s.name));
    const dbServiceNames = new Set(allServices.map(s => s.name));

    const missingInDB = SERVICES.filter(s => !dbServiceNames.has(s.name));
    const extraInDB = allServices.filter(s => !configServiceNames.has(s.name));

    if (missingInDB.length > 0) {
      console.log(`  ❌ Missing in Production Database (${missingInDB.length}):`);
      missingInDB.forEach(s => {
        console.log(`     - ${s.name} (${s.category})`);
      });
    } else {
      console.log(`  ✅ All config services exist in database`);
    }

    if (extraInDB.length > 0) {
      console.log(`\n  ⚠️  Extra services in database (${extraInDB.length}):`);
      extraInDB.forEach(s => {
        console.log(`     - ${s.name} (Category: ${s.category.name})`);
      });
    }

    // 4. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY\n');

    const issues: string[] = [];

    if (missingCategories.length > 0) {
      issues.push(`Missing categories: ${missingCategories.join(', ')}`);
    }

    if (!mobileCarWash) {
      issues.push('Mobile Car Wash service is missing');
    }

    if (beautyCategory && beautyCategory.services.length !== expectedBeautyServices) {
      issues.push(`Beauty services count mismatch: ${beautyCategory.services.length}/${expectedBeautyServices}`);
    }

    if (missingInDB.length > 0) {
      issues.push(`${missingInDB.length} services from config are missing in database`);
    }

    if (redundantCategories.length > 0) {
      issues.push(`Redundant categories found: ${redundantCategories.map(c => c.name).join(', ')}`);
    }

    if (issues.length === 0) {
      console.log('✅ All changes are in production!');
      console.log('   - Mobile Car Wash: ✅');
      console.log('   - Beauty & Personal Care: ✅');
      console.log('   - All subcategories: ✅');
      console.log('   - No redundant categories: ✅');
    } else {
      console.log('⚠️  Issues found in production:\n');
      issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
      console.log('\n💡 These services need to be synced to production.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductionState()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  });
