#!/usr/bin/env tsx

/**
 * User Deletion System Test Script
 * 
 * Tests the user deletion implementation to verify:
 * - Anonymization works for users with transactional data
 * - Hard delete works for users with zero data
 * - Idempotency (safe to retry)
 * - Error handling
 * 
 * Usage:
 *   tsx scripts/test-user-deletion.ts
 * 
 * Environment:
 *   - Requires DATABASE_URL (development database)
 *   - Requires test admin user
 */

import { PrismaClient } from '@prisma/client';
import { deleteUser, getUserDeletionPreview } from '../lib/services/user-deletion-service';

const prisma = new PrismaClient();

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    await fn();
    results.push({ name, passed: true });
    console.log(`✅ PASSED: ${name}`);
  } catch (error: any) {
    results.push({ name, passed: false, error: error.message, details: error });
    console.error(`❌ FAILED: ${name}`);
    console.error(`   Error: ${error.message}`);
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  // Clean up any test users created during testing
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: '@test-deletion.local',
      },
    },
  });
  
  console.log('✅ Cleanup completed');
}

async function main() {
  console.log('='.repeat(80));
  console.log('🧪 User Deletion System Test Suite');
  console.log('='.repeat(80));
  
  try {
    // Test 1: Preview functionality
    await test('Get user deletion preview', async () => {
      // Find a test user (or create one)
      const testUser = await prisma.user.findFirst({
        where: { role: 'CLIENT' },
      });
      
      if (!testUser) {
        throw new Error('No test user found');
      }
      
      const preview = await getUserDeletionPreview(testUser.id);
      
      if (!preview) {
        throw new Error('Preview returned null');
      }
      
      if (!preview._previewOnly) {
        throw new Error('Preview missing advisory flag');
      }
      
      console.log(`   Preview data:`, {
        userId: preview.id,
        transactionalData: preview.transactionalData,
      });
    });
    
    // Test 2: Soft delete (always allowed)
    await test('Soft delete user', async () => {
      const testUser = await prisma.user.create({
        data: {
          email: `test-soft-delete-${Date.now()}@test-deletion.local`,
          name: 'Test Soft Delete User',
          role: 'CLIENT',
          isActive: true,
        },
      });
      
      const result = await deleteUser({
        userId: testUser.id,
        adminId: testUser.id, // Will be blocked by self-deletion check
        permanent: false,
        reason: 'Test soft delete',
      });
      
      // Should fail due to self-deletion check
      if (result.action !== 'deactivated') {
        throw new Error(`Expected deactivated, got ${result.action}`);
      }
      
      // Clean up
      await prisma.user.delete({ where: { id: testUser.id } });
    });
    
    // Test 3: Hard delete (zero transactional data)
    await test('Hard delete user with zero data', async () => {
      // Create a test admin user
      const adminUser = await prisma.user.create({
        data: {
          email: `test-admin-${Date.now()}@test-deletion.local`,
          name: 'Test Admin',
          role: 'ADMIN',
          isActive: true,
        },
      });
      
      // Create a test user with zero transactional data
      const testUser = await prisma.user.create({
        data: {
          email: `test-hard-delete-${Date.now()}@test-deletion.local`,
          name: 'Test Hard Delete User',
          role: 'CLIENT',
          isActive: true,
        },
      });
      
      const result = await deleteUser({
        userId: testUser.id,
        adminId: adminUser.id,
        permanent: true,
        reason: 'Test hard delete',
      });
      
      if (result.action !== 'deleted') {
        throw new Error(`Expected deleted, got ${result.action}`);
      }
      
      // Verify user is deleted
      const deletedUser = await prisma.user.findUnique({
        where: { id: testUser.id },
      });
      
      if (deletedUser) {
        throw new Error('User should be deleted but still exists');
      }
      
      // Clean up admin
      await prisma.user.delete({ where: { id: adminUser.id } });
    });
    
    // Test 4: Anonymization (user with bookings)
    await test('Anonymize user with transactional data', async () => {
      // Create test admin
      const adminUser = await prisma.user.create({
        data: {
          email: `test-admin-${Date.now()}@test-deletion.local`,
          name: 'Test Admin',
          role: 'ADMIN',
          isActive: true,
        },
      });
      
      // Create test user with booking
      const testUser = await prisma.user.create({
        data: {
          email: `test-anonymize-${Date.now()}@test-deletion.local`,
          name: 'Test Anonymize User',
          role: 'CLIENT',
          isActive: true,
        },
      });
      
      // Create a provider and booking
      const provider = await prisma.provider.create({
        data: {
          userId: testUser.id,
          status: 'APPROVED',
        },
      });
      
      const service = await prisma.service.findFirst();
      if (!service) {
        throw new Error('No service found for test booking');
      }
      
      await prisma.booking.create({
        data: {
          clientId: testUser.id,
          providerId: provider.id,
          serviceId: service.id,
          scheduledDate: new Date(),
          duration: 60,
          totalAmount: 100,
          platformFee: 10,
          address: 'Test Address',
          status: 'COMPLETED',
        },
      });
      
      const result = await deleteUser({
        userId: testUser.id,
        adminId: adminUser.id,
        permanent: true,
        reason: 'Test anonymization',
      });
      
      if (result.action !== 'anonymized') {
        throw new Error(`Expected anonymized, got ${result.action}`);
      }
      
      if (!result.preservedData) {
        throw new Error('Preserved data should be present');
      }
      
      if (result.preservedData.clientBookings === 0 && result.preservedData.providerBookings === 0) {
        throw new Error('Should have preserved bookings');
      }
      
      // Verify user is anonymized
      const anonymizedUser = await prisma.user.findUnique({
        where: { id: testUser.id },
      });
      
      if (!anonymizedUser) {
        throw new Error('User should exist but be anonymized');
      }
      
      if (!anonymizedUser.deletedAt) {
        throw new Error('User should have deletedAt timestamp');
      }
      
      if (!anonymizedUser.email.includes('@example.invalid')) {
        throw new Error('User email should be anonymized');
      }
      
      if (anonymizedUser.name !== 'Deleted User') {
        throw new Error('User name should be anonymized');
      }
      
      // Clean up
      await prisma.booking.deleteMany({ where: { clientId: testUser.id } });
      await prisma.provider.delete({ where: { id: provider.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
      await prisma.user.delete({ where: { id: adminUser.id } });
    });
    
    // Test 5: Idempotency
    await test('Idempotent deletion (already anonymized)', async () => {
      // Create test admin
      const adminUser = await prisma.user.create({
        data: {
          email: `test-admin-${Date.now()}@test-deletion.local`,
          name: 'Test Admin',
          role: 'ADMIN',
          isActive: true,
        },
      });
      
      // Create and anonymize a user
      const testUser = await prisma.user.create({
        data: {
          email: `test-idempotent-${Date.now()}@test-deletion.local`,
          name: 'Test Idempotent User',
          role: 'CLIENT',
          isActive: true,
          deletedAt: new Date(), // Already anonymized
        },
      });
      
      // Try to delete again (should succeed idempotently)
      const result = await deleteUser({
        userId: testUser.id,
        adminId: adminUser.id,
        permanent: true,
        reason: 'Test idempotency',
      });
      
      if (result.action !== 'anonymized') {
        throw new Error(`Expected anonymized (idempotent), got ${result.action}`);
      }
      
      if (result.message !== 'User already anonymized') {
        throw new Error('Should return idempotent message');
      }
      
      // Clean up
      await prisma.user.delete({ where: { id: testUser.id } });
      await prisma.user.delete({ where: { id: adminUser.id } });
    });
    
    // Test 6: Self-deletion prevention
    await test('Prevent admin self-deletion', async () => {
      const adminUser = await prisma.user.create({
        data: {
          email: `test-admin-self-${Date.now()}@test-deletion.local`,
          name: 'Test Admin',
          role: 'ADMIN',
          isActive: true,
        },
      });
      
      try {
        await deleteUser({
          userId: adminUser.id,
          adminId: adminUser.id, // Same user
          permanent: true,
          reason: 'Test self-deletion',
        });
        
        throw new Error('Should have thrown error for self-deletion');
      } catch (error: any) {
        if (!error.message.includes('Cannot delete your own account')) {
          throw new Error(`Expected self-deletion error, got: ${error.message}`);
        }
      }
      
      // Clean up
      await prisma.user.delete({ where: { id: adminUser.id } });
    });
    
  } catch (error: any) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
  
  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(80));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
    if (!result.passed && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log('\n' + '='.repeat(80));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('='.repeat(80));
  
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
