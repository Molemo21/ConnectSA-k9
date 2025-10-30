#!/usr/bin/env node
/**
 * Comprehensive Booking Flow Test
 * - Simulates the exact frontend flow
 * - Tests with real data from database
 * - Identifies the exact mismatch causing 500 error
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testBookingFlow() {
  console.log('🔍 Comprehensive Booking Flow Test');
  console.log('===================================');
  
  try {
    // Step 1: Get a real provider with catalogue items
    console.log('\n📋 Step 1: Finding providers with catalogue items...');
    const providersWithCatalogue = await prisma.provider.findMany({
      where: {
        status: 'APPROVED',
        catalogueItems: {
          some: {
            isActive: true
          }
        }
      },
      include: {
        catalogueItems: {
          where: { isActive: true },
          take: 1
        },
        services: {
          take: 1
        }
      },
      take: 3
    });

    console.log(`Found ${providersWithCatalogue.length} providers with catalogue items`);
    
    if (providersWithCatalogue.length === 0) {
      console.log('❌ No providers with catalogue items found!');
      return;
    }

    // Step 2: Test each provider's catalogue items
    for (const provider of providersWithCatalogue) {
      console.log(`\n📦 Testing Provider: ${provider.businessName} (${provider.id})`);
      console.log(`   Catalogue Items: ${provider.catalogueItems.length}`);
      
      if (provider.catalogueItems.length > 0) {
        const catalogueItem = provider.catalogueItems[0];
        console.log(`   Sample Item: ${catalogueItem.id} - ${catalogueItem.title}`);
        
        // Step 3: Test the exact API query
        console.log('   🔍 Testing API query...');
        const apiResult = await prisma.catalogueItem.findFirst({
          where: {
            id: catalogueItem.id,
            providerId: provider.id,
            isActive: true
          },
          include: {
            service: true
          }
        });
        
        if (apiResult) {
          console.log('   ✅ API query successful');
          console.log(`   📊 Price: R${apiResult.price}, Duration: ${apiResult.durationMins}min`);
      } else {
          console.log('   ❌ API query failed - item not found');
        }
      }
    }

    // Step 4: Test with a specific provider and catalogue item
    console.log('\n🎯 Step 4: Testing specific booking scenario...');
    const testProvider = providersWithCatalogue[0];
    const testCatalogueItem = testProvider.catalogueItems[0];
    const testService = testProvider.services[0];

    console.log(`Provider: ${testProvider.businessName} (${testProvider.id})`);
    console.log(`Catalogue Item: ${testCatalogueItem.id} - ${testCatalogueItem.title}`);
    console.log(`Service: ${testService.serviceId} - ${testService.service?.name}`);

    // Step 5: Simulate the exact API call
    console.log('\n📡 Step 5: Simulating API call...');
    const simulatedPayload = {
      providerId: testProvider.id,
      serviceId: testService.serviceId,
      date: '2024-12-25',
      time: '14:00',
      address: 'Test Address',
      notes: 'Test booking',
      catalogueItemId: testCatalogueItem.id
    };

    console.log('Payload:', JSON.stringify(simulatedPayload, null, 2));

    // Test the catalogue item query
    const catalogueItem = await prisma.catalogueItem.findFirst({
      where: {
        id: simulatedPayload.catalogueItemId,
        providerId: simulatedPayload.providerId,
        isActive: true
      },
      include: {
        service: true
      }
    });

    if (catalogueItem) {
      console.log('✅ Catalogue item found successfully');
      console.log(`   Price: R${catalogueItem.price}`);
      console.log(`   Duration: ${catalogueItem.durationMins} minutes`);
      console.log(`   Currency: ${catalogueItem.currency}`);
    } else {
      console.log('❌ Catalogue item not found');
      
      // Check if it exists at all
      const anyItem = await prisma.catalogueItem.findFirst({
        where: { id: simulatedPayload.catalogueItemId }
      });
      
      if (anyItem) {
        console.log('🔍 Item exists but provider mismatch:');
        console.log(`   Requested Provider: ${simulatedPayload.providerId}`);
        console.log(`   Actual Provider: ${anyItem.providerId}`);
        console.log(`   Active: ${anyItem.isActive}`);
      } else {
        console.log('🔍 Item does not exist at all');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function checkDataConsistency() {
  console.log('\n🔍 Data Consistency Check');
  console.log('=========================');
  
  try {
    // Check for orphaned catalogue items
    const orphanedItems = await prisma.catalogueItem.findMany({
      where: {
        OR: [
          { provider: null },
          { service: null }
        ]
      }
    });

    console.log(`Orphaned catalogue items: ${orphanedItems.length}`);
    if (orphanedItems.length > 0) {
      console.log('⚠️  Found orphaned items:', orphanedItems.map(item => item.id));
    }

    // Check for inactive items
    const inactiveItems = await prisma.catalogueItem.count({
      where: { isActive: false }
    });

    console.log(`Inactive catalogue items: ${inactiveItems}`);

    // Check provider-service relationships
    const providersWithoutServices = await prisma.provider.findMany({
      where: {
        services: {
          none: {}
        }
      }
    });

    console.log(`Providers without services: ${providersWithoutServices.length}`);

  } catch (error) {
    console.error('❌ Consistency check failed:', error);
  }
}

async function main() {
  await testBookingFlow();
  await checkDataConsistency();
  
  console.log('\n🎯 Analysis Complete');
  console.log('===================');
  console.log('If all tests pass, the issue is likely:');
  console.log('1. Frontend sending wrong catalogue item ID');
  console.log('2. Provider ID mismatch in frontend');
  console.log('3. Catalogue item being deactivated between selection and booking');
  console.log('4. Race condition in data fetching');
}

main().catch(async (error) => {
  console.error('❌ Test failed:', error);
  try { await prisma.$disconnect(); } catch {}
      process.exit(1);
    });
