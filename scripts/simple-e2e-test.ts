/**
 * Simple E2E Test for Hybrid Package System
 * 
 * This script tests the core functionality without requiring
 * a running server instance.
 */

const { PrismaClient } = require('@prisma/client');
const { createStarterPackages, getPackageGenerationStats, validatePackageGeneration } = require('../lib/services/package-generator');

const prisma = new PrismaClient();

async function runSimpleE2ETests() {
  console.log('🧪 Running Simple E2E Tests for Hybrid Package System...\n');

  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  try {
    // Test 1: Package Generation Service
    console.log('📦 Testing Package Generation Service...');
    try {
      const stats = await getPackageGenerationStats();
      console.log(`✅ Package generation stats: ${stats.totalPackages} packages, ${stats.providersWithPackages} providers`);
      results.passed++;
    } catch (error) {
      console.log(`❌ Package generation stats failed: ${error}`);
      results.failed++;
    }
    results.total++;

    // Test 2: Database Schema
    console.log('\n🗄️ Testing Database Schema...');
    try {
      const providers = await prisma.provider.findMany({
        take: 1,
        select: {
          id: true,
          catalogueSetupCompleted: true,
          catalogueSetupCompletedAt: true
        }
      });
      console.log('✅ Database schema includes catalogue setup tracking fields');
      results.passed++;
    } catch (error) {
      console.log(`❌ Database schema test failed: ${error}`);
      results.failed++;
    }
    results.total++;

    // Test 3: Notification Types
    console.log('\n🔔 Testing Notification Types...');
    try {
      const notificationTypes = [
        'CATALOGUE_SETUP_REQUIRED',
        'CATALOGUE_SETUP_COMPLETED',
        'CATALOGUE_SETUP_REMINDER'
      ];
      
      // Check if we can create notifications with these types
      const testUser = await prisma.user.findFirst({
        where: { role: 'PROVIDER' }
      });

      if (testUser) {
        const notification = await prisma.notification.create({
          data: {
            userId: testUser.id,
            type: 'CATALOGUE_SETUP_REQUIRED',
            title: 'Test Notification',
            message: 'Test notification for E2E testing',
            isRead: false
          }
        });

        await prisma.notification.delete({
          where: { id: notification.id }
        });

        console.log('✅ Notification types working correctly');
        results.passed++;
      } else {
        console.log('⏭️ No test user found, skipping notification test');
      }
    } catch (error) {
      console.log(`❌ Notification types test failed: ${error}`);
      results.failed++;
    }
    results.total++;

    // Test 4: Catalogue Items
    console.log('\n📋 Testing Catalogue Items...');
    try {
      const catalogueItems = await prisma.catalogueItem.findMany({
        take: 5,
        include: {
          provider: {
            select: { businessName: true }
          },
          service: {
            select: { name: true }
          }
        }
      });

      console.log(`✅ Found ${catalogueItems.length} catalogue items`);
      if (catalogueItems.length > 0) {
        console.log(`   Sample: ${catalogueItems[0].title} by ${catalogueItems[0].provider.businessName}`);
      }
      results.passed++;
    } catch (error) {
      console.log(`❌ Catalogue items test failed: ${error}`);
      results.failed++;
    }
    results.total++;

    // Test 5: Provider Services
    console.log('\n👥 Testing Provider Services...');
    try {
      const providerServices = await prisma.providerService.findMany({
        take: 5,
        include: {
          provider: {
            select: { businessName: true }
          },
          service: {
            select: { name: true }
          }
        }
      });

      console.log(`✅ Found ${providerServices.length} provider-service relationships`);
      if (providerServices.length > 0) {
        console.log(`   Sample: ${providerServices[0].provider.businessName} offers ${providerServices[0].service.name}`);
      }
      results.passed++;
    } catch (error) {
      console.log(`❌ Provider services test failed: ${error}`);
      results.failed++;
    }
    results.total++;

    // Test 6: Validation Function
    console.log('\n🔍 Testing Validation Function...');
    try {
      const validation = await validatePackageGeneration('fake-provider-id', ['fake-service-id']);
      console.log(`✅ Validation function working: ${validation.isValid ? 'Valid' : 'Invalid'}`);
      results.passed++;
    } catch (error) {
      console.log(`❌ Validation function test failed: ${error}`);
      results.failed++;
    }
    results.total++;

  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    await prisma.$disconnect();
  }

  // Print results
  console.log('\n📊 Test Results Summary:');
  console.log('='.repeat(40));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! The hybrid package system is ready.');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the errors above.');
  }

  return results;
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runSimpleE2ETests()
    .then((results) => {
      process.exit(results.failed === 0 ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { runSimpleE2ETests };
