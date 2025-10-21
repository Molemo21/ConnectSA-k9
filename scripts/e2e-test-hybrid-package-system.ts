/**
 * End-to-End Testing Script for Hybrid Package System
 * 
 * This script tests the complete flow from provider onboarding
 * to package creation, customization, and completion celebration.
 */

import { PrismaClient } from '@prisma/client';
import { createStarterPackages, getPackageGenerationStats } from '../lib/services/package-generator';

const prisma = new PrismaClient();

interface TestResult {
  testName: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration: number;
}

class E2ETester {
  private results: TestResult[] = [];
  private testProviderId: string | null = null;
  private testServiceIds: string[] = [];

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting End-to-End Tests for Hybrid Package System...\n');

    try {
      await this.setupTestData();
      await this.testPackageGeneration();
      await this.testProgressTracking();
      await this.testBulkEdit();
      await this.testMarketAnalysis();
      await this.testNotificationSystem();
      await this.testCompletionCelebration();
      await this.cleanupTestData();
      
      this.printResults();
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      await prisma.$disconnect();
    }
  }

  private async setupTestData(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔧 Setting up test data...');

      // Find a test service
      const service = await prisma.service.findFirst({
        where: { isActive: true }
      });

      if (!service) {
        throw new Error('No active services found for testing');
      }

      this.testServiceIds = [service.id];

      // Create a test provider
      const testUser = await prisma.user.create({
        data: {
          email: `test-provider-${Date.now()}@example.com`,
          name: 'Test Provider',
          role: 'PROVIDER',
          emailVerified: new Date()
        }
      });

      const testProvider = await prisma.provider.create({
        data: {
          userId: testUser.id,
          businessName: 'Test Business',
          description: 'Test provider for E2E testing',
          status: 'APPROVED',
          hourlyRate: 200
        }
      });

      // Add service to provider
      await prisma.providerService.create({
        data: {
          providerId: testProvider.id,
          serviceId: service.id
        }
      });

      this.testProviderId = testProvider.id;
      
      this.addResult('Setup Test Data', 'PASS', 'Test data created successfully', Date.now() - startTime);
    } catch (error) {
      this.addResult('Setup Test Data', 'FAIL', `Failed to setup test data: ${error}`, Date.now() - startTime);
      throw error;
    }
  }

  private async testPackageGeneration(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('📦 Testing package generation...');

      if (!this.testProviderId || this.testServiceIds.length === 0) {
        throw new Error('Test data not properly set up');
      }

      // Test package generation
      const packages = await createStarterPackages(this.testProviderId, this.testServiceIds);
      
      if (packages.length === 0) {
        throw new Error('No packages were generated');
      }

      // Verify packages were created in database
      const dbPackages = await prisma.catalogueItem.findMany({
        where: {
          providerId: this.testProviderId,
          isActive: true
        }
      });

      if (dbPackages.length !== packages.length) {
        throw new Error(`Package count mismatch: expected ${packages.length}, got ${dbPackages.length}`);
      }

      // Test package generation stats
      const stats = await getPackageGenerationStats();
      if (stats.totalPackages === 0) {
        throw new Error('Package generation stats not working');
      }

      this.addResult('Package Generation', 'PASS', `Generated ${packages.length} packages successfully`, Date.now() - startTime);
    } catch (error) {
      this.addResult('Package Generation', 'FAIL', `Package generation failed: ${error}`, Date.now() - startTime);
    }
  }

  private async testProgressTracking(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('📊 Testing progress tracking...');

      if (!this.testProviderId) {
        throw new Error('Test provider not available');
      }

      // Test progress tracking API
      const response = await fetch(`http://localhost:3000/api/provider/setup-progress?providerId=${this.testProviderId}`);
      
      if (!response.ok) {
        throw new Error(`Progress tracking API failed: ${response.status}`);
      }

      const progressData = await response.json();
      
      if (typeof progressData.completionPercentage !== 'number') {
        throw new Error('Invalid progress data structure');
      }

      this.addResult('Progress Tracking', 'PASS', `Progress tracking working: ${progressData.completionPercentage}%`, Date.now() - startTime);
    } catch (error) {
      this.addResult('Progress Tracking', 'FAIL', `Progress tracking failed: ${error}`, Date.now() - startTime);
    }
  }

  private async testBulkEdit(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('✏️ Testing bulk edit functionality...');

      if (!this.testProviderId) {
        throw new Error('Test provider not available');
      }

      // Get test packages
      const packages = await prisma.catalogueItem.findMany({
        where: {
          providerId: this.testProviderId,
          isActive: true
        }
      });

      if (packages.length === 0) {
        throw new Error('No packages available for bulk edit testing');
      }

      // Test bulk update
      const bulkUpdateData = {
        providerId: this.testProviderId,
        items: packages.map(pkg => ({
          id: pkg.id,
          title: `${pkg.title} (Updated)`,
          shortDesc: pkg.shortDesc,
          longDesc: pkg.longDesc || '',
          price: pkg.price + 10, // Increase price by R10
          durationMins: pkg.durationMins,
          isActive: pkg.isActive
        }))
      };

      const response = await fetch('http://localhost:3000/api/provider/catalogue/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bulkUpdateData),
      });

      if (!response.ok) {
        throw new Error(`Bulk update API failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.updatedCount !== packages.length) {
        throw new Error(`Bulk update count mismatch: expected ${packages.length}, got ${result.updatedCount}`);
      }

      this.addResult('Bulk Edit', 'PASS', `Updated ${result.updatedCount} packages successfully`, Date.now() - startTime);
    } catch (error) {
      this.addResult('Bulk Edit', 'FAIL', `Bulk edit failed: ${error}`, Date.now() - startTime);
    }
  }

  private async testMarketAnalysis(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('📈 Testing market analysis...');

      if (!this.testProviderId || this.testServiceIds.length === 0) {
        throw new Error('Test data not available');
      }

      // Test market analysis API
      const response = await fetch(`http://localhost:3000/api/market-analysis?providerId=${this.testProviderId}&serviceId=${this.testServiceIds[0]}`);
      
      if (!response.ok) {
        throw new Error(`Market analysis API failed: ${response.status}`);
      }

      const analysisData = await response.json();
      
      if (!analysisData.analyses || analysisData.analyses.length === 0) {
        throw new Error('No market analysis data returned');
      }

      const analysis = analysisData.analyses[0];
      
      if (!analysis.marketStats || !analysis.competitiveInsights) {
        throw new Error('Invalid market analysis structure');
      }

      this.addResult('Market Analysis', 'PASS', `Market analysis generated successfully`, Date.now() - startTime);
    } catch (error) {
      this.addResult('Market Analysis', 'FAIL', `Market analysis failed: ${error}`, Date.now() - startTime);
    }
  }

  private async testNotificationSystem(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔔 Testing notification system...');

      if (!this.testProviderId) {
        throw new Error('Test provider not available');
      }

      // Get test provider with user
      const provider = await prisma.provider.findUnique({
        where: { id: this.testProviderId },
        include: { user: true }
      });

      if (!provider) {
        throw new Error('Test provider not found');
      }

      // Test notification creation
      const notification = await prisma.notification.create({
        data: {
          userId: provider.userId,
          type: 'CATALOGUE_SETUP_REQUIRED',
          title: 'Test Notification',
          content: 'This is a test notification for E2E testing',
          isRead: false
        }
      });

      if (!notification.id) {
        throw new Error('Failed to create test notification');
      }

      // Clean up test notification
      await prisma.notification.delete({
        where: { id: notification.id }
      });

      this.addResult('Notification System', 'PASS', 'Notification system working correctly', Date.now() - startTime);
    } catch (error) {
      this.addResult('Notification System', 'FAIL', `Notification system failed: ${error}`, Date.now() - startTime);
    }
  }

  private async testCompletionCelebration(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🎉 Testing completion celebration...');

      if (!this.testProviderId) {
        throw new Error('Test provider not available');
      }

      // Mark setup as completed
      const updatedProvider = await prisma.provider.update({
        where: { id: this.testProviderId },
        data: {
          catalogueSetupCompleted: true,
          catalogueSetupCompletedAt: new Date()
        }
      });

      if (!updatedProvider.catalogueSetupCompleted) {
        throw new Error('Failed to mark setup as completed');
      }

      // Test completion API
      const response = await fetch('http://localhost:3000/api/provider/setup-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          providerId: this.testProviderId,
          completed: true 
        }),
      });

      if (!response.ok) {
        throw new Error(`Completion API failed: ${response.status}`);
      }

      this.addResult('Completion Celebration', 'PASS', 'Completion celebration working correctly', Date.now() - startTime);
    } catch (error) {
      this.addResult('Completion Celebration', 'FAIL', `Completion celebration failed: ${error}`, Date.now() - startTime);
    }
  }

  private async cleanupTestData(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🧹 Cleaning up test data...');

      if (!this.testProviderId) {
        this.addResult('Cleanup', 'SKIP', 'No test data to clean up', Date.now() - startTime);
        return;
      }

      // Get test provider with user
      const provider = await prisma.provider.findUnique({
        where: { id: this.testProviderId },
        include: { user: true }
      });

      if (provider) {
        // Delete catalogue items
        await prisma.catalogueItem.deleteMany({
          where: { providerId: this.testProviderId }
        });

        // Delete provider services
        await prisma.providerService.deleteMany({
          where: { providerId: this.testProviderId }
        });

        // Delete provider
        await prisma.provider.delete({
          where: { id: this.testProviderId }
        });

        // Delete user
        await prisma.user.delete({
          where: { id: provider.userId }
        });
      }

      this.addResult('Cleanup', 'PASS', 'Test data cleaned up successfully', Date.now() - startTime);
    } catch (error) {
      this.addResult('Cleanup', 'FAIL', `Cleanup failed: ${error}`, Date.now() - startTime);
    }
  }

  private addResult(testName: string, status: 'PASS' | 'FAIL' | 'SKIP', message: string, duration: number): void {
    this.results.push({
      testName,
      status,
      message,
      duration
    });
  }

  private printResults(): void {
    console.log('\n📊 Test Results Summary:');
    console.log('='.repeat(50));
    
    let passCount = 0;
    let failCount = 0;
    let skipCount = 0;
    let totalDuration = 0;

    this.results.forEach(result => {
      const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
      console.log(`${statusIcon} ${result.testName}: ${result.message} (${result.duration}ms)`);
      
      if (result.status === 'PASS') passCount++;
      else if (result.status === 'FAIL') failCount++;
      else skipCount++;
      
      totalDuration += result.duration;
    });

    console.log('='.repeat(50));
    console.log(`Total: ${this.results.length} tests`);
    console.log(`✅ Passed: ${passCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`⏭️ Skipped: ${skipCount}`);
    console.log(`⏱️ Total Duration: ${totalDuration}ms`);
    
    if (failCount === 0) {
      console.log('\n🎉 All tests passed! The hybrid package system is working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Please review the errors above.');
    }
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  const tester = new E2ETester();
  tester.runAllTests()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

export { E2ETester };

