import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function validateSchema() {
  console.log('🔍 Starting Schema Validation...\n');
  const results: any = {};
  const issues: string[] = [];

  try {
    // 1. Service Categories Validation
    console.log('Checking Service Categories...');
    const categories = await prisma.serviceCategory.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        services: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        }
      }
    });

    results.serviceCategories = {
      total: categories.length,
      active: categories.filter(c => c.isActive).length,
      withServices: categories.filter(c => c.services.length > 0).length
    };

    // 2. Check for Orphaned Services
    console.log('Checking for Orphaned Services...');
    const orphanedServices = await prisma.service.findMany({
      where: {
        category: null
      }
    });

    if (orphanedServices.length > 0) {
      issues.push(`⚠️ Found ${orphanedServices.length} services without categories`);
      results.orphanedServices = orphanedServices.map(s => s.id);
    }

    // 3. Verify Provider Status Distribution
    console.log('Checking Provider Status Distribution...');
    const providerStatusCounts = await prisma.provider.groupBy({
      by: ['status'],
      _count: true
    });

    results.providerStatus = providerStatusCounts.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>);

    // 4. Check Booking Status Distribution
    console.log('Checking Booking Status Distribution...');
    const bookingStatusCounts = await prisma.booking.groupBy({
      by: ['status'],
      _count: true
    });

    results.bookingStatus = bookingStatusCounts.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>);

    // 5. Check for Orphaned Bookings
    console.log('Checking for Orphaned Bookings...');
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
      issues.push(`⚠️ Found ${orphanedBookings.length} orphaned bookings`);
      results.orphanedBookings = orphanedBookings.map(b => b.id);
    }

    // 6. Verify Payment Integrity
    console.log('Checking Payment Integrity...');
    const paymentsWithoutBookings = await prisma.payment.findMany({
      where: {
        booking: null
      }
    });

    if (paymentsWithoutBookings.length > 0) {
      issues.push(`⚠️ Found ${paymentsWithoutBookings.length} payments without associated bookings`);
      results.paymentsWithoutBookings = paymentsWithoutBookings.map(p => p.id);
    }

    // 7. Check User-Provider Relationship
    console.log('Checking User-Provider Relationships...');
    const providersWithoutUsers = await prisma.provider.findMany({
      where: {
        user: null
      }
    });

    if (providersWithoutUsers.length > 0) {
      issues.push(`⚠️ Found ${providersWithoutUsers.length} providers without associated users`);
      results.providersWithoutUsers = providersWithoutUsers.map(p => p.id);
    }

    // Generate Report
    const report = {
      timestamp: new Date().toISOString(),
      results,
      issues,
      summary: {
        totalIssues: issues.length,
        status: issues.length === 0 ? '✅ PASSED' : '⚠️ ISSUES FOUND'
      }
    };

    // Save Report
    const reportPath = join(process.cwd(), 'reports', `schema-validation-${Date.now()}.json`);
    writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📊 Validation Complete!');
    console.log(`Report saved to: ${reportPath}`);
    
    if (issues.length > 0) {
      console.log('\n⚠️ Issues Found:');
      issues.forEach(issue => console.log(`- ${issue}`));
    } else {
      console.log('\n✅ No issues found! Schema is healthy.');
    }

    return report;

  } catch (error) {
    console.error('❌ Validation failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute if run directly
if (require.main === module) {
  validateSchema()
    .catch(console.error)
    .finally(() => process.exit());
}

export { validateSchema };
