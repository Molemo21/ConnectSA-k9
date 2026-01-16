import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.development
const envPath = resolve(process.cwd(), '.env.development');
config({ path: envPath });

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

async function checkMobileCarWash() {
  console.log('🔍 Checking Mobile Car Wash service...\n');

  try {
    // Check if service exists
    const carWash = await prisma.service.findFirst({
      where: {
        name: { contains: 'Car Wash', mode: 'insensitive' }
      },
      include: {
        category: true
      }
    });

    if (!carWash) {
      console.log('❌ Mobile Car Wash service NOT FOUND in database');
      return;
    }

    console.log('✅ Found Mobile Car Wash service:');
    console.log(`   ID: ${carWash.id}`);
    console.log(`   Name: ${carWash.name}`);
    console.log(`   Description: ${carWash.description}`);
    console.log(`   Base Price: R${carWash.basePrice}`);
    console.log(`   Is Active: ${carWash.isActive}`);
    console.log(`   Category ID: ${carWash.categoryId}`);
    console.log(`   Category Name: ${carWash.category?.name || 'N/A'}`);
    console.log(`   Category Active: ${carWash.category?.isActive || 'N/A'}`);

    // Check what API would return
    console.log('\n📊 Checking what API would return...');
    const apiServices = await prisma.service.findMany({
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

    const carWashInApi = apiServices.find(s => s.name.includes('Car Wash'));
    
    if (carWashInApi) {
      console.log('✅ Mobile Car Wash WOULD be returned by API');
      console.log(`   Position in list: ${apiServices.indexOf(carWashInApi) + 1} of ${apiServices.length}`);
    } else {
      console.log('❌ Mobile Car Wash would NOT be returned by API');
      console.log('\n🔍 Checking why...');
      
      if (!carWash.isActive) {
        console.log('   ❌ Service is not active');
      }
      if (!carWash.category) {
        console.log('   ❌ Service has no category');
      }
      if (carWash.category && !carWash.category.isActive) {
        console.log('   ❌ Service category is not active');
      }
    }

    // List all cleaning services
    console.log('\n📋 All Cleaning Services in API response:');
    const cleaningServices = apiServices.filter(s => 
      s.category?.name === 'Cleaning Services'
    );
    cleaningServices.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.name} - R${s.basePrice || 0} (Active: ${s.isActive})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMobileCarWash()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  });
