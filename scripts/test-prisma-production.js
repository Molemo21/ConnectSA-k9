#!/usr/bin/env node
/**
 * Test Prisma Client in Production Environment
 * - Tests if Prisma client works correctly
 * - Verifies database connection
 * - Tests basic queries
 */

const { PrismaClient } = require('@prisma/client');

async function testPrismaClient() {
  console.log('🔍 Testing Prisma Client');
  console.log('========================');
  
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    console.log('📡 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');

    console.log('\n📦 Testing basic queries...');
    
    // Test user count
    const userCount = await prisma.user.count();
    console.log(`✅ Users: ${userCount}`);

    // Test provider count
    const providerCount = await prisma.provider.count();
    console.log(`✅ Providers: ${providerCount}`);

    // Test catalogue items count
    const catalogueCount = await prisma.catalogueItem.count();
    console.log(`✅ Catalogue Items: ${catalogueCount}`);

    // Test a specific catalogue item query
    console.log('\n🔍 Testing catalogue item query...');
    const sampleItem = await prisma.catalogueItem.findFirst({
      where: { isActive: true },
      include: {
        provider: { select: { id: true, businessName: true } },
        service: { select: { id: true, name: true } }
      }
    });

    if (sampleItem) {
      console.log('✅ Sample catalogue item found:');
      console.log(`   ID: ${sampleItem.id}`);
      console.log(`   Provider: ${sampleItem.provider.businessName} (${sampleItem.provider.id})`);
      console.log(`   Service: ${sampleItem.service.name} (${sampleItem.service.id})`);
      console.log(`   Price: R${sampleItem.price}`);
      console.log(`   Active: ${sampleItem.isActive}`);
    } else {
      console.log('❌ No catalogue items found');
    }

    // Test the exact query from the API
    console.log('\n🎯 Testing API query pattern...');
    if (sampleItem) {
      const apiQueryResult = await prisma.catalogueItem.findFirst({
        where: {
          id: sampleItem.id,
          providerId: sampleItem.providerId,
          isActive: true
        },
        include: {
          service: true
        }
      });

      if (apiQueryResult) {
        console.log('✅ API query pattern works');
        console.log(`   Found: ${apiQueryResult.title}`);
      } else {
        console.log('❌ API query pattern failed');
      }
    }

  } catch (error) {
    console.error('❌ Prisma test failed:', error);
    
    if (error.code) {
      console.log(`Error code: ${error.code}`);
    }
    
    if (error.message) {
      console.log(`Error message: ${error.message}`);
    }
  } finally {
    await prisma.$disconnect();
    console.log('\n✅ Prisma client disconnected');
  }
}

testPrismaClient().catch(console.error);

