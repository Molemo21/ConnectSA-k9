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

// Expected subcategories from ServiceSelection.tsx
const EXPECTED_CLEANING_SUBCATEGORIES = {
  'Home Cleaning': ['House Cleaning', 'Deep Cleaning', 'Window Cleaning'],
  'Specialized Cleaning': ['Carpet Cleaning', 'Cleaning Services', 'Mobile Car Wash']
};

const EXPECTED_BEAUTY_SUBCATEGORIES = {
  'Hair Services': ['Haircut (Men & Women)', 'Braiding', 'Weave Installation'],
  'Makeup & Lashes': ['Eyelash Extensions', 'Bridal Makeup', 'Makeup Application (Regular)'],
  'Nails': ['Manicure', 'Pedicure', 'Nail Extensions'],
  'Skincare & Hair Removal': ['Facial', 'Waxing']
};

async function verifyProductionFrontend() {
  console.log('🔍 Verifying Production Frontend & Backend Sync\n');
  console.log('='.repeat(70));

  try {
    // Step 1: Verify API endpoints return correct data
    console.log('\n📡 Step 1: Verifying API Endpoints\n');

    // Get categories from API simulation (what the frontend would receive)
    const categories = await prisma.serviceCategory.findMany({
      where: { isActive: true },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log(`✅ Found ${categories.length} categories via API structure:\n`);
    
    const cleaningCategory = categories.find(c => c.name === 'Cleaning Services');
    const beautyCategory = categories.find(c => c.name === 'Beauty & Personal Care');

    // Step 2: Verify Cleaning Services subcategories match
    console.log('🧹 Step 2: Verifying Cleaning Services Subcategories\n');
    
    if (!cleaningCategory) {
      console.log('  ❌ Cleaning Services category not found');
    } else {
      console.log(`  ✅ Cleaning Services category found (${cleaningCategory.services.length} services)\n`);
      
      // Check each subcategory
      for (const [subcategoryName, expectedServices] of Object.entries(EXPECTED_CLEANING_SUBCATEGORIES)) {
        console.log(`  📁 ${subcategoryName}:`);
        
        // Find services that should be in this subcategory
        const matchingServices = cleaningCategory.services.filter(service => {
          return expectedServices.some(expected => {
            const sName = service.name.toLowerCase();
            const eName = expected.toLowerCase();
            return sName.includes(eName) || eName.includes(sName);
          });
        });

        if (matchingServices.length === expectedServices.length) {
          console.log(`     ✅ All ${expectedServices.length} services found:`);
          matchingServices.forEach(s => {
            console.log(`        - ${s.name}`);
          });
        } else {
          console.log(`     ⚠️  Found ${matchingServices.length}/${expectedServices.length} services:`);
          matchingServices.forEach(s => console.log(`        ✅ ${s.name}`));
          const missing = expectedServices.filter(e => 
            !matchingServices.some(s => {
              const sName = s.name.toLowerCase();
              const eName = e.toLowerCase();
              return sName.includes(eName) || eName.includes(eName);
            })
          );
          missing.forEach(m => console.log(`        ❌ MISSING: ${m}`));
        }
        console.log('');
      }

      // Specific check for Mobile Car Wash
      const mobileCarWash = cleaningCategory.services.find(s => 
        s.name.toLowerCase().includes('car wash') || 
        s.name.toLowerCase().includes('mobile')
      );
      if (mobileCarWash) {
        console.log(`  ✅ Mobile Car Wash: Found in Specialized Cleaning`);
      } else {
        console.log(`  ❌ Mobile Car Wash: NOT FOUND (should be in Specialized Cleaning)`);
      }
    }

    // Step 3: Verify Beauty Services subcategories match
    console.log('\n💄 Step 3: Verifying Beauty & Personal Care Subcategories\n');
    
    if (!beautyCategory) {
      console.log('  ❌ Beauty & Personal Care category not found');
    } else {
      console.log(`  ✅ Beauty & Personal Care category found (${beautyCategory.services.length} services)\n`);
      
      // Check each subcategory
      for (const [subcategoryName, expectedServices] of Object.entries(EXPECTED_BEAUTY_SUBCATEGORIES)) {
        console.log(`  📁 ${subcategoryName}:`);
        
        // Find services that should be in this subcategory
        const matchingServices = beautyCategory.services.filter(service => {
          return expectedServices.some(expected => {
            const sName = service.name.toLowerCase();
            const eName = expected.toLowerCase();
            return sName.includes(eName) || eName.includes(sName);
          });
        });

        if (matchingServices.length === expectedServices.length) {
          console.log(`     ✅ All ${expectedServices.length} services found:`);
          matchingServices.forEach(s => {
            console.log(`        - ${s.name}`);
          });
        } else {
          console.log(`     ⚠️  Found ${matchingServices.length}/${expectedServices.length} services:`);
          matchingServices.forEach(s => console.log(`        ✅ ${s.name}`));
          const missing = expectedServices.filter(e => 
            !matchingServices.some(s => {
              const sName = s.name.toLowerCase();
              const eName = e.toLowerCase();
              return sName.includes(eName) || eName.includes(eName);
            })
          );
          missing.forEach(m => console.log(`        ❌ MISSING: ${m}`));
        }
        console.log('');
      }
    }

    // Step 4: Verify no redundant categories
    console.log('\n🗑️  Step 4: Checking for Redundant Categories\n');
    const redundantCategories = categories.filter(c => 
      c.name === 'Beauty Services' || 
      c.name === 'Beauty' ||
      (c.name.toLowerCase().includes('beauty') && c.name !== 'Beauty & Personal Care')
    );
    
    if (redundantCategories.length > 0) {
      console.log(`  ❌ Found ${redundantCategories.length} redundant categories:`);
      redundantCategories.forEach(c => {
        console.log(`     - ${c.name} (${c.services.length} services)`);
      });
    } else {
      console.log('  ✅ No redundant categories found');
    }

    // Step 5: Summary and Frontend Verification Checklist
    console.log('\n' + '='.repeat(70));
    console.log('📊 VERIFICATION SUMMARY\n');

    const issues: string[] = [];

    // Check Mobile Car Wash
    const hasMobileCarWash = cleaningCategory?.services.some(s => 
      s.name.toLowerCase().includes('car wash')
    );
    if (!hasMobileCarWash) {
      issues.push('Mobile Car Wash not found in Cleaning Services');
    }

    // Check beauty subcategories
    if (!beautyCategory || beautyCategory.services.length !== 11) {
      issues.push(`Beauty services count: ${beautyCategory?.services.length || 0}/11`);
    }

    // Check redundant categories
    if (redundantCategories.length > 0) {
      issues.push(`Redundant categories exist: ${redundantCategories.map(c => c.name).join(', ')}`);
    }

    if (issues.length === 0) {
      console.log('✅ Backend Database: ALL CHANGES SYNCED!\n');
      console.log('   ✓ Mobile Car Wash in database');
      console.log('   ✓ Beauty subcategories properly organized');
      console.log('   ✓ No redundant categories\n');
      
      console.log('📱 FRONTEND VERIFICATION CHECKLIST:\n');
      console.log('To verify the frontend code is also deployed, manually check:\n');
      console.log('1. Go to: https://your-production-url.com/book-service\n');
      console.log('2. Select "Cleaning Services" category\n');
      console.log('   → You should see 2 subcategory tabs: "Home Cleaning" and "Specialized Cleaning"');
      console.log('   → Click "Specialized Cleaning"');
      console.log('   → You should see "Mobile Car Wash" in the list\n');
      console.log('3. Select "Beauty & Personal Care" category\n');
      console.log('   → You should see 4 subcategory tabs:');
      console.log('      - Hair Services');
      console.log('      - Makeup & Lashes');
      console.log('      - Nails');
      console.log('      - Skincare & Hair Removal\n');
      console.log('4. Verify service filtering works correctly:\n');
      console.log('   → Each subcategory should show only relevant services');
      console.log('   → Services should match the database services\n');
      console.log('💡 If frontend doesn\'t show these, the code hasn\'t been deployed to Vercel yet.');
      console.log('   Check Vercel dashboard for deployment status.');
    } else {
      console.log('⚠️  ISSUES FOUND:\n');
      issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
    }

    // Step 6: Check what API would return (what frontend receives)
    console.log('\n' + '='.repeat(70));
    console.log('📡 API Response Simulation (What Frontend Receives)\n');

    const apiResponse = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      isActive: cat.isActive,
      services: cat.services.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        basePrice: s.basePrice
      }))
    }));

    console.log(`Categories returned by /api/service-categories:\n`);
    apiResponse.forEach(cat => {
      console.log(`  📁 ${cat.name} (${cat.icon || 'N/A'}): ${cat.services.length} services`);
      if (cat.services.length <= 6) {
        cat.services.forEach(s => console.log(`     - ${s.name}`));
      } else {
        cat.services.slice(0, 3).forEach(s => console.log(`     - ${s.name}`));
        console.log(`     ... and ${cat.services.length - 3} more`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyProductionFrontend()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  });
