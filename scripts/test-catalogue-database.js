#!/usr/bin/env node
/**
 * Test Catalogue Item Database Access
 * - Tests database connection
 * - Verifies CatalogueItem model exists
 * - Checks if catalogue items exist
 * - Tests specific catalogue item queries
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection');
  console.log('==============================');
  
  try {
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test if CatalogueItem model exists
    console.log('\n📦 Testing CatalogueItem model...');
    const catalogueCount = await prisma.catalogueItem.count();
    console.log(`✅ CatalogueItem model accessible - ${catalogueCount} items found`);
    
    if (catalogueCount > 0) {
      // Get a sample catalogue item
      const sampleItem = await prisma.catalogueItem.findFirst({
        include: {
          provider: {
            select: { id: true, businessName: true }
          },
          service: {
            select: { id: true, name: true }
          }
        }
      });
      
      console.log('\n📊 Sample Catalogue Item:');
      console.log(JSON.stringify(sampleItem, null, 2));
      
      // Test the specific query from the API
      console.log('\n🔍 Testing API Query Pattern...');
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
      
      console.log('✅ API query pattern works:', apiQueryResult ? 'Found' : 'Not found');
      
    } else {
      console.log('⚠️  No catalogue items found in database');
      console.log('🔧 This might be why the API is failing');
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    
    if (error.code === 'P2001') {
      console.log('🔍 Error: Record not found - CatalogueItem model might not exist');
    } else if (error.code === 'P1001') {
      console.log('🔍 Error: Database connection failed');
    } else if (error.code === 'P2021') {
      console.log('🔍 Error: Table does not exist - schema not synced');
    } else {
      console.log('🔍 Error details:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function testSpecificCatalogueItem() {
  console.log('\n🎯 Testing Specific Catalogue Item Query');
  console.log('=========================================');
  
  try {
    // Test with a real-looking catalogue item ID
    const testId = 'cat_test123456789012345678901';
    
    console.log(`🔍 Testing with ID: ${testId}`);
    
    const result = await prisma.catalogueItem.findFirst({
      where: {
        id: testId,
        isActive: true
      }
    });
    
    console.log('Result:', result ? 'Found' : 'Not found');
    
    if (!result) {
      console.log('🔍 Checking if any catalogue items exist...');
      const anyItem = await prisma.catalogueItem.findFirst();
      console.log('Any catalogue item:', anyItem ? 'Found' : 'Not found');
      
      if (anyItem) {
        console.log('Sample ID format:', anyItem.id);
      }
    }
    
  } catch (error) {
    console.error('❌ Specific test failed:', error.message);
  }
}

async function main() {
  await testDatabaseConnection();
  await testSpecificCatalogueItem();
  
  console.log('\n🎯 Analysis:');
  console.log('If CatalogueItem model is not accessible, the issue is:');
  console.log('1. Prisma client needs regeneration: npx prisma generate');
  console.log('2. Database schema not synced: npx prisma db push');
  console.log('3. Database connection issues');
  console.log('\nIf no catalogue items exist, the issue is:');
  console.log('1. Catalogue items not created yet');
  console.log('2. Need to run the backfill script');
}

main().catch(async (error) => {
  console.error('❌ Test failed:', error);
  try { await prisma.$disconnect(); } catch {}
  process.exit(1);
});

