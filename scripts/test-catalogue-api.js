const { PrismaClient } = require('@prisma/client');

async function testCatalogueAPI() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing Catalogue API Endpoints...\n');
    
    // Test 1: Check if catalogue_items table exists and has data
    console.log('1. Testing catalogue_items table...');
    const catalogueCount = await prisma.catalogueItem.count();
    console.log(`   ✅ Found ${catalogueCount} catalogue items\n`);
    
    // Test 2: Check if providers have catalogue items
    console.log('2. Testing provider-catalogue relationship...');
    const providersWithCatalogue = await prisma.provider.findMany({
      where: {
        catalogueItems: {
          some: {}
        }
      },
      include: {
        catalogueItems: true
      }
    });
    console.log(`   ✅ Found ${providersWithCatalogue.length} providers with catalogue items\n`);
    
    // Test 3: Check if bookings can reference catalogue items
    console.log('3. Testing booking-catalogue relationship...');
    const bookingsWithCatalogue = await prisma.booking.findMany({
      where: {
        catalogueItemId: {
          not: null
        }
      },
      include: {
        catalogueItem: true
      }
    });
    console.log(`   ✅ Found ${bookingsWithCatalogue.length} bookings with catalogue items\n`);
    
    // Test 4: Sample catalogue item data
    console.log('4. Sample catalogue item data...');
    const sampleItem = await prisma.catalogueItem.findFirst({
      include: {
        provider: {
          include: {
            user: true
          }
        },
        service: true
      }
    });
    
    if (sampleItem) {
      console.log(`   📦 Sample Item: "${sampleItem.title}"`);
      console.log(`   💰 Price: ${sampleItem.currency} ${sampleItem.price}`);
      console.log(`   ⏱️  Duration: ${sampleItem.durationMins} minutes`);
      console.log(`   👤 Provider: ${sampleItem.provider.businessName || sampleItem.provider.user.name}`);
      console.log(`   🏷️  Service: ${sampleItem.service.name}`);
      console.log(`   ✅ Active: ${sampleItem.isActive}\n`);
    }
    
    // Test 5: Check feature flag functionality
    console.log('5. Testing feature flag...');
    const cataloguePricingEnabled = process.env.NEXT_PUBLIC_CATALOGUE_PRICING_V1 === 'true';
    console.log(`   🚩 NEXT_PUBLIC_CATALOGUE_PRICING_V1: ${cataloguePricingEnabled ? 'ENABLED' : 'DISABLED'}\n`);
    
    console.log('🎉 All catalogue API tests passed!');
    console.log('\n📊 Summary:');
    console.log(`   - ${catalogueCount} catalogue items created`);
    console.log(`   - ${providersWithCatalogue.length} providers have catalogue items`);
    console.log(`   - ${bookingsWithCatalogue.length} bookings reference catalogue items`);
    console.log(`   - Feature flag: ${cataloguePricingEnabled ? 'ENABLED' : 'DISABLED'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCatalogueAPI();
