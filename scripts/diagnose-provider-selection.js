#!/usr/bin/env node

/**
 * Diagnostic script to identify issues with provider selection
 * This script checks database tables, relationships, and test queries
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function main() {
  console.log('🔍 Starting provider selection diagnostic...\n');
  const results = [];

  // 1. Check database connection
  console.log('1️⃣ Checking database connection...');
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful\n');
    results.push({
      check: 'Database Connection',
      status: 'PASS',
      details: 'Successfully connected to database',
    });
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    results.push({
      check: 'Database Connection',
      status: 'FAIL',
      details: 'Failed to connect to database',
      error: error.message,
    });
    return results;
  }

  // 2. Check if required tables exist
  console.log('2️⃣ Checking required tables...');
  const tablesToCheck = [
    'users',
    'providers',
    'services',
    'provider_services',
    'bookings',
    'proposals',
  ];

  for (const table of tablesToCheck) {
    try {
      const result = await prisma.$queryRawUnsafe(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${table}'
        );
      `);
      const exists = result[0]?.exists;
      
      if (exists) {
        console.log(`✅ Table '${table}' exists`);
        results.push({
          check: `Table: ${table}`,
          status: 'PASS',
          details: 'Table exists',
        });
      } else {
        console.log(`❌ Table '${table}' does NOT exist`);
        results.push({
          check: `Table: ${table}`,
          status: 'FAIL',
          details: 'Table does not exist',
        });
      }
    } catch (error) {
      console.error(`❌ Error checking table '${table}':`, error.message);
      results.push({
        check: `Table: ${table}`,
        status: 'FAIL',
        details: 'Error checking table',
        error: error.message,
      });
    }
  }
  console.log('');

  // 3. Check for services
  console.log('3️⃣ Checking services...');
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        category: true,
        _count: {
          select: { providers: true },
        },
      },
    });

    console.log(`✅ Found ${services.length} active services:`);
    services.forEach((service) => {
      console.log(`   - ${service.name} (${service.id}) - ${service._count.providers} providers`);
    });
    console.log('');

    results.push({
      check: 'Services',
      status: services.length > 0 ? 'PASS' : 'WARNING',
      details: `Found ${services.length} active services`,
    });
  } catch (error) {
    console.error('❌ Error fetching services:', error.message);
    results.push({
      check: 'Services',
      status: 'FAIL',
      details: 'Error fetching services',
      error: error.message,
    });
  }

  // 4. Check for approved providers
  console.log('4️⃣ Checking approved providers...');
  try {
    const providers = await prisma.provider.findMany({
      where: {
        status: 'APPROVED',
        available: true,
      },
      select: {
        id: true,
        businessName: true,
        status: true,
        available: true,
        _count: {
          select: { services: true },
        },
      },
    });

    console.log(`✅ Found ${providers.length} approved and available providers:`);
    providers.forEach((provider) => {
      console.log(`   - ${provider.businessName || 'N/A'} (${provider.id}) - ${provider._count.services} services`);
    });
    console.log('');

    results.push({
      check: 'Approved Providers',
      status: providers.length > 0 ? 'PASS' : 'WARNING',
      details: `Found ${providers.length} approved and available providers`,
    });
  } catch (error) {
    console.error('❌ Error fetching providers:', error.message);
    results.push({
      check: 'Approved Providers',
      status: 'FAIL',
      details: 'Error fetching providers',
      error: error.message,
    });
  }

  // 5. Check provider-service relationships
  console.log('5️⃣ Checking provider-service relationships...');
  try {
    const providerServices = await prisma.providerService.findMany({
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
            status: true,
            available: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    console.log(`✅ Found ${providerServices.length} provider-service relationships`);
    
    // Group by service
    const byService = providerServices.reduce((acc, ps) => {
      const serviceName = ps.service.name;
      if (!acc[serviceName]) acc[serviceName] = [];
      acc[serviceName].push(ps);
      return acc;
    }, {});

    Object.entries(byService).forEach(([serviceName, psList]) => {
      const availableCount = psList.filter(
        ps => ps.provider.status === 'APPROVED' && ps.provider.available
      ).length;
      console.log(`   - ${serviceName}: ${psList.length} total, ${availableCount} available`);
    });
    console.log('');

    results.push({
      check: 'Provider-Service Relationships',
      status: providerServices.length > 0 ? 'PASS' : 'WARNING',
      details: `Found ${providerServices.length} relationships`,
    });
  } catch (error) {
    console.error('❌ Error checking provider-service relationships:', error.message);
    results.push({
      check: 'Provider-Service Relationships',
      status: 'FAIL',
      details: 'Error checking relationships',
      error: error.message,
    });
  }

  // 6. Test a sample provider query (simulating the send-offer flow)
  console.log('6️⃣ Testing sample provider query...');
  try {
    const services = await prisma.service.findFirst({
      where: { isActive: true },
    });

    if (!services) {
      console.log('⚠️ No active services to test with');
      results.push({
        check: 'Sample Provider Query',
        status: 'WARNING',
        details: 'No active services to test',
      });
    } else {
      const testServiceId = services.id;
      console.log(`   Testing with service: ${services.name} (${testServiceId})`);

      const providers = await prisma.provider.findMany({
        where: {
          services: {
            some: { serviceId: testServiceId },
          },
          available: true,
          status: 'APPROVED',
        },
        include: {
          services: {
            where: { serviceId: testServiceId },
          },
        },
        take: 5,
      });

      console.log(`✅ Found ${providers.length} providers for service ${services.name}`);
      providers.forEach((provider) => {
        console.log(`   - ${provider.businessName || 'N/A'} (${provider.id})`);
        console.log(`     Rate: R${provider.services[0]?.customRate || provider.hourlyRate || 'N/A'}/hr`);
      });
      console.log('');

      results.push({
        check: 'Sample Provider Query',
        status: providers.length > 0 ? 'PASS' : 'WARNING',
        details: `Query successful, found ${providers.length} providers`,
      });
    }
  } catch (error) {
    console.error('❌ Error in sample provider query:', error.message);
    console.error('Full error:', error);
    results.push({
      check: 'Sample Provider Query',
      status: 'FAIL',
      details: 'Error running sample query',
      error: error.message,
    });
  }

  // 7. Check for recent bookings
  console.log('7️⃣ Checking recent bookings...');
  try {
    const recentBookings = await prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        service: { select: { name: true } },
        provider: { select: { businessName: true } },
        client: { select: { name: true, email: true } },
      },
    });

    console.log(`✅ Found ${recentBookings.length} recent bookings`);
    recentBookings.forEach((booking) => {
      console.log(`   - ${booking.service.name} by ${booking.provider.businessName || 'N/A'}`);
      console.log(`     Client: ${booking.client.name} (${booking.client.email})`);
      console.log(`     Status: ${booking.status} | Date: ${booking.scheduledDate.toISOString()}`);
    });
    console.log('');

    results.push({
      check: 'Recent Bookings',
      status: 'PASS',
      details: `Found ${recentBookings.length} recent bookings`,
    });
  } catch (error) {
    console.error('❌ Error checking recent bookings:', error.message);
    results.push({
      check: 'Recent Bookings',
      status: 'FAIL',
      details: 'Error checking bookings',
      error: error.message,
    });
  }

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(80) + '\n');

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const warnings = results.filter((r) => r.status === 'WARNING').length;

  results.forEach((result) => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${result.check}: ${result.details}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log(`Total: ${results.length} checks | ✅ ${passed} passed | ❌ ${failed} failed | ⚠️ ${warnings} warnings`);
  console.log('='.repeat(80));

  if (failed > 0) {
    console.log('\n⚠️ CRITICAL ISSUES DETECTED - Please review the failed checks above');
  } else if (warnings > 0) {
    console.log('\n⚠️ Some warnings detected - System may work but check warnings above');
  } else {
    console.log('\n✅ All checks passed! Provider selection should work correctly');
  }

  await prisma.$disconnect();
  return results;
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error during diagnostics:', error);
    process.exit(1);
  });

