/**
 * Test script for Package Generation Service
 * 
 * This script tests the package generation functionality
 * with sample data to ensure it works correctly.
 */

import { createStarterPackages, getPackageGenerationStats, validatePackageGeneration } from '../lib/services/package-generator';

async function testPackageGeneration() {
  console.log('🧪 Testing Package Generation Service...\n');

  try {
    // Test 1: Get current stats
    console.log('📊 Current Package Generation Stats:');
    const stats = await getPackageGenerationStats();
    console.log(`- Total Providers: ${stats.totalProviders}`);
    console.log(`- Providers with Packages: ${stats.providersWithPackages}`);
    console.log(`- Total Packages: ${stats.totalPackages}`);
    console.log(`- Average Packages per Provider: ${stats.averagePackagesPerProvider}\n`);

    // Test 2: Validate package generation (with fake data)
    console.log('🔍 Testing Validation:');
    const validation = await validatePackageGeneration('fake-provider-id', ['fake-service-id']);
    console.log(`- Is Valid: ${validation.isValid}`);
    console.log(`- Errors: ${validation.errors.join(', ')}\n`);

    console.log('✅ Package Generation Service tests completed successfully!');

  } catch (error) {
    console.error('❌ Package Generation Service test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testPackageGeneration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

export { testPackageGeneration };

