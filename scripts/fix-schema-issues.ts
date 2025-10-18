import { PrismaClient } from '@prisma/client';
import { validateSchema } from './validate-schema';

const prisma = new PrismaClient();

async function fixSchemaIssues() {
  console.log('🔧 Starting Schema Fixes...\n');
  const fixes: string[] = [];

  try {
    // 1. Fix Orphaned Services
    console.log('Fixing Orphaned Services...');
    const defaultCategory = await prisma.serviceCategory.findFirst({
      where: {
        name: 'Cleaning Services'
      }
    });

    if (defaultCategory) {
      const orphanedServices = await prisma.service.findMany({
        where: {
          category: null
        }
      });

      if (orphanedServices.length > 0) {
        await prisma.service.updateMany({
          where: {
            category: null
          },
          data: {
            categoryId: defaultCategory.id
          }
        });
        fixes.push(`✅ Assigned ${orphanedServices.length} orphaned services to default category`);
      }
    }

    // 2. Clean up Orphaned Bookings
    console.log('Cleaning up Orphaned Bookings...');
    const orphanedBookings = await prisma.booking.findMany({
      where: {
        OR: [
          { provider: null },
          { service: null },
          { client: null }
        ]
      }
    });

    if (orphanedBookings.length > 0) {
      await prisma.booking.updateMany({
        where: {
          OR: [
            { provider: null },
            { service: null },
            { client: null }
          ]
        },
        data: {
          status: 'CANCELLED'
        }
      });
      fixes.push(`✅ Marked ${orphanedBookings.length} orphaned bookings as CANCELLED`);
    }

    // 3. Fix Payments Without Bookings
    console.log('Fixing Payments Without Bookings...');
    const paymentsWithoutBookings = await prisma.payment.findMany({
      where: {
        booking: null
      }
    });

    if (paymentsWithoutBookings.length > 0) {
      await prisma.payment.updateMany({
        where: {
          booking: null
        },
        data: {
          status: 'FAILED'
        }
      });
      fixes.push(`✅ Marked ${paymentsWithoutBookings.length} orphaned payments as FAILED`);
    }

    // 4. Clean up Provider Records
    console.log('Cleaning up Provider Records...');
    const providersWithoutUsers = await prisma.provider.findMany({
      where: {
        user: null
      }
    });

    if (providersWithoutUsers.length > 0) {
      await prisma.provider.updateMany({
        where: {
          user: null
        },
        data: {
          status: 'SUSPENDED'
        }
      });
      fixes.push(`✅ Marked ${providersWithoutUsers.length} providers without users as SUSPENDED`);
    }

    // Run validation again to verify fixes
    console.log('\n🔍 Verifying fixes...');
    const validationReport = await validateSchema();

    // Generate Fix Report
    const report = {
      timestamp: new Date().toISOString(),
      fixes,
      validationAfterFixes: validationReport,
      summary: {
        totalFixes: fixes.length,
        status: validationReport.issues.length === 0 ? '✅ ALL ISSUES RESOLVED' : '⚠️ SOME ISSUES REMAIN'
      }
    };

    console.log('\n📊 Fix Summary:');
    fixes.forEach(fix => console.log(`- ${fix}`));
    
    if (validationReport.issues.length > 0) {
      console.log('\n⚠️ Remaining Issues:');
      validationReport.issues.forEach(issue => console.log(`- ${issue}`));
    } else {
      console.log('\n✅ All issues have been resolved!');
    }

    return report;

  } catch (error) {
    console.error('❌ Fix process failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute if run directly
if (require.main === module) {
  fixSchemaIssues()
    .catch(console.error)
    .finally(() => process.exit());
}

export { fixSchemaIssues };
