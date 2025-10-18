import { PrismaClient } from '@prisma/client';
import { validateSchema } from './validate-schema';
import { fixSchemaIssues } from './fix-schema-issues';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

// Ensure reports directory exists
const reportsDir = join(process.cwd(), 'reports');
if (!existsSync(reportsDir)) {
  mkdirSync(reportsDir);
}

async function createTestData() {
  console.log('🔧 Creating test data...');

  try {
    // Create test service category
    const category = await prisma.serviceCategory.create({
      data: {
        name: 'Test Category',
        description: 'Test category for validation',
        isActive: true
      }
    });

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        role: 'CLIENT',
        emailVerified: true
      }
    });

    // Create test provider
    const provider = await prisma.provider.create({
      data: {
        userId: user.id,
        businessName: 'Test Business',
        status: 'APPROVED',
        available: true
      }
    });

    // Create test service
    const service = await prisma.service.create({
      data: {
        name: 'Test Service',
        categoryId: category.id,
        description: 'Test service description',
        basePrice: 100,
        isActive: true
      }
    });

    // Create test booking
    const booking = await prisma.booking.create({
      data: {
        serviceId: service.id,
        clientId: user.id,
        providerId: provider.id,
        scheduledDate: new Date(),
        duration: 60,
        totalAmount: 100,
        platformFee: 10,
        address: 'Test Address',
        status: 'PENDING'
      }
    });

    // Create test payment
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        userId: user.id,
        amount: 100,
        status: 'PENDING'
      }
    });

    console.log('✅ Test data created successfully');
    return { category, user, provider, service, booking };
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  }
}

async function createProblematicData() {
  console.log('🔧 Creating problematic test data...');

  try {
    // Create orphaned service (no category)
    const orphanedService = await prisma.$executeRaw`
      INSERT INTO "services" ("id", "name", "description", "basePrice", "isActive", "createdAt", "updatedAt")
      VALUES (
        'test_orphaned_service',
        'Orphaned Service',
        'Service without category',
        100,
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      );
    `;

    // Create payment without booking
    const user = await prisma.user.findFirst();
    if (user) {
      await prisma.$executeRaw`
        INSERT INTO "payments" ("id", "userId", "amount", "status", "createdAt", "updatedAt")
        VALUES (
          'test_orphaned_payment',
          ${user.id},
          100,
          'PENDING',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        );
      `;
    }

    console.log('✅ Problematic test data created successfully');
  } catch (error) {
    console.error('❌ Error creating problematic test data:', error);
    throw error;
  }
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');

  try {
    // Clean up in reverse order of dependencies
    await prisma.payment.deleteMany({
      where: {
        OR: [
          { id: 'test_orphaned_payment' },
          { booking: { serviceId: { startsWith: 'test_' } } }
        ]
      }
    });

    await prisma.booking.deleteMany({
      where: { serviceId: { startsWith: 'test_' } }
    });

    await prisma.service.deleteMany({
      where: { 
        OR: [
          { id: 'test_orphaned_service' },
          { categoryId: { startsWith: 'test_' } }
        ]
      }
    });

    await prisma.provider.deleteMany({
      where: { userId: { startsWith: 'test_' } }
    });

    await prisma.user.deleteMany({
      where: { id: { startsWith: 'test_' } }
    });

    await prisma.serviceCategory.deleteMany({
      where: { id: { startsWith: 'test_' } }
    });

    console.log('✅ Test data cleaned up successfully');
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
    throw error;
  }
}

async function runTests() {
  console.log('🧪 Starting schema validation tests...\n');

  try {
    // Step 1: Create normal test data
    console.log('\n📝 Step 1: Creating normal test data...');
    const testData = await createTestData();
    console.log('✅ Normal test data created');

    // Step 2: Run initial validation
    console.log('\n📝 Step 2: Running initial validation...');
    const initialValidation = await validateSchema();
    console.log('Initial validation results:', initialValidation.summary);

    // Step 3: Create problematic data
    console.log('\n📝 Step 3: Creating problematic test data...');
    await createProblematicData();
    console.log('✅ Problematic test data created');

    // Step 4: Run validation again
    console.log('\n📝 Step 4: Running validation after creating problems...');
    const problemValidation = await validateSchema();
    console.log('Problem validation results:', problemValidation.summary);

    // Step 5: Run fixes
    console.log('\n📝 Step 5: Running automatic fixes...');
    const fixResults = await fixSchemaIssues();
    console.log('Fix results:', fixResults.summary);

    // Step 6: Final validation
    console.log('\n📝 Step 6: Running final validation...');
    const finalValidation = await validateSchema();
    console.log('Final validation results:', finalValidation.summary);

    // Generate test report
    const testReport = {
      timestamp: new Date().toISOString(),
      steps: {
        initialValidation: initialValidation.summary,
        problemValidation: problemValidation.summary,
        fixes: fixResults.summary,
        finalValidation: finalValidation.summary
      },
      success: finalValidation.issues.length === 0
    };

    // Save test report
    const reportPath = join(reportsDir, `validation-test-${Date.now()}.json`);
    writeFileSync(reportPath, JSON.stringify(testReport, null, 2));
    console.log(`\n📊 Test report saved to: ${reportPath}`);

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await cleanupTestData();
    console.log('✅ Test data cleaned up');

    return testReport;

  } catch (error) {
    console.error('❌ Test execution failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests()
    .then(report => {
      console.log('\n🎉 Tests completed!');
      console.log('Final status:', report.success ? '✅ PASSED' : '❌ FAILED');
      process.exit(report.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

export { runTests };
