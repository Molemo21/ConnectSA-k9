import { PrismaClient } from '@prisma/client';
import { BEAUTY_SUBCATEGORIES, CLEANING_SUBCATEGORIES } from '../config/services';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.development') });

const prisma = new PrismaClient();

async function checkSubcategories() {
  console.log('🔍 Checking Subcategory Configuration\n');
  console.log('='.repeat(60) + '\n');

  // Check config exports
  console.log('📋 Subcategories from config/services.ts:');
  console.log('\n  BEAUTY_SUBCATEGORIES:');
  Object.keys(BEAUTY_SUBCATEGORIES).forEach(key => {
    console.log(`    - ${key}: ${BEAUTY_SUBCATEGORIES[key].length} services`);
  });
  
  console.log('\n  CLEANING_SUBCATEGORIES:');
  Object.keys(CLEANING_SUBCATEGORIES).forEach(key => {
    console.log(`    - ${key}: ${CLEANING_SUBCATEGORIES[key].length} services`);
  });

  // Check database categories
  console.log('\n📊 Categories in Database:\n');
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

  categories.forEach(cat => {
    console.log(`  ✅ ${cat.name}`);
    console.log(`     ID: ${cat.id}`);
    console.log(`     Services: ${cat.services.length}`);
    console.log(`     Exact name match for Beauty: ${cat.name === 'Beauty & Personal Care'}`);
    console.log(`     Exact name match for Cleaning: ${cat.name === 'Cleaning Services'}`);
    console.log(`     Trimmed name: "${cat.name.trim()}"`);
    console.log('');
  });

  // Check if cleaning services match subcategory definitions
  const cleaningCategory = categories.find(c => c.name.trim() === 'Cleaning Services');
  if (cleaningCategory) {
    console.log('🔍 Verifying Cleaning Services Match Subcategories:\n');
    const allCleaningSubcategoryServices = Object.values(CLEANING_SUBCATEGORIES).flat();
    cleaningCategory.services.forEach(service => {
      const inSubcategory = allCleaningSubcategoryServices.some(subName => 
        service.name.toLowerCase().includes(subName.toLowerCase()) ||
        subName.toLowerCase().includes(service.name.toLowerCase())
      );
      console.log(`  ${inSubcategory ? '✅' : '❌'} ${service.name} ${inSubcategory ? '(in subcategory)' : '(NOT in any subcategory)'}`);
    });
  } else {
    console.log('❌ Cleaning Services category not found in database!');
  }

  await prisma.$disconnect();
}

checkSubcategories()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
