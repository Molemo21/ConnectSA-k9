#!/usr/bin/env node

/**
 * Verify that services shown in UI exist in database and have providers
 */

const { PrismaClient } = require('@prisma/client');

// SECURITY: Require DATABASE_URL from environment - no hardcoded credentials
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is required');
  console.error('   Please set DATABASE_URL in your .env file or environment');
  console.error('   Example: DATABASE_URL="postgresql://user:pass@host:port/db"');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('🔍 Verifying services and providers...\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Get all active services
    const services = await prisma.service.findMany({
      where: { isActive: true },
      include: {
        providers: {
          include: {
            provider: {
              select: {
                id: true,
                businessName: true,
                status: true,
                available: true,
              }
            }
          }
        },
        _count: {
          select: {
            providers: true,
            bookings: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log(`📊 Found ${services.length} active services in database\n`);
    console.log('=' .repeat(80));
    console.log('SERVICE ANALYSIS');
    console.log('='.repeat(80) + '\n');

    let servicesWithProviders = 0;
    let servicesWithApprovedProviders = 0;
    let servicesWithAvailableProviders = 0;
    let servicesWithoutProviders = [];
    let servicesWithoutAvailableProviders = [];

    services.forEach((service, idx) => {
      const totalProviders = service.providers.length;
      const approvedProviders = service.providers.filter(
        p => p.provider.status === 'APPROVED'
      );
      const availableProviders = service.providers.filter(
        p => p.provider.status === 'APPROVED' && p.provider.available
      );

      console.log(`${(idx + 1).toString().padStart(2)}. ${service.name}`);
      console.log(`    ID: ${service.id}`);
      console.log(`    Category: ${service.category}`);
      console.log(`    Base Price: R${service.basePrice || 'Not set'}`);
      console.log(`    Total Providers: ${totalProviders}`);
      console.log(`    Approved Providers: ${approvedProviders.length}`);
      console.log(`    Available Providers: ${availableProviders.length}`);
      console.log(`    Total Bookings: ${service._count.bookings}`);

      if (totalProviders > 0) {
        servicesWithProviders++;
      } else {
        servicesWithoutProviders.push(service.name);
      }

      if (approvedProviders.length > 0) {
        servicesWithApprovedProviders++;
      }

      if (availableProviders.length > 0) {
        servicesWithAvailableProviders++;
      } else {
        servicesWithoutAvailableProviders.push(service.name);
      }

      if (availableProviders.length > 0) {
        console.log(`    ✅ Has available providers:`);
        availableProviders.forEach(p => {
          console.log(`       - ${p.provider.businessName || 'N/A'} (${p.provider.id})`);
        });
      } else if (approvedProviders.length > 0) {
        console.log(`    ⚠️  Has approved but unavailable providers:`);
        approvedProviders.forEach(p => {
          console.log(`       - ${p.provider.businessName || 'N/A'} (unavailable)`);
        });
      } else if (totalProviders > 0) {
        console.log(`    ❌ Has providers but none approved`);
      } else {
        console.log(`    ❌ NO PROVIDERS ASSIGNED`);
      }

      console.log('');
    });

    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80) + '\n');

    console.log(`📊 Total Active Services: ${services.length}`);
    console.log(`✅ Services with providers: ${servicesWithProviders} (${((servicesWithProviders/services.length)*100).toFixed(1)}%)`);
    console.log(`✅ Services with approved providers: ${servicesWithApprovedProviders} (${((servicesWithApprovedProviders/services.length)*100).toFixed(1)}%)`);
    console.log(`✅ Services with available providers: ${servicesWithAvailableProviders} (${((servicesWithAvailableProviders/services.length)*100).toFixed(1)}%)`);
    console.log('');

    if (servicesWithoutProviders.length > 0) {
      console.log('❌ Services WITHOUT any providers:');
      servicesWithoutProviders.forEach(name => {
        console.log(`   - ${name}`);
      });
      console.log('');
    }

    if (servicesWithoutAvailableProviders.length > 0) {
      console.log('⚠️  Services WITHOUT available providers:');
      servicesWithoutAvailableProviders.forEach(name => {
        console.log(`   - ${name}`);
      });
      console.log('');
    }

    // Check what the API returns
    console.log('='.repeat(80));
    console.log('API RESPONSE SIMULATION (/api/services)');
    console.log('='.repeat(80) + '\n');

    const apiServices = services.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      category: s.category,
      basePrice: s.basePrice,
      isActive: s.isActive
    }));

    console.log(`The /api/services endpoint will return ${apiServices.length} services:`);
    apiServices.forEach((s, idx) => {
      console.log(`${(idx + 1).toString().padStart(2)}. ${s.name} - ${s.category} (${s.id})`);
    });
    console.log('');

    // Recommendations
    console.log('='.repeat(80));
    console.log('RECOMMENDATIONS');
    console.log('='.repeat(80) + '\n');

    if (servicesWithoutProviders.length > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log(`   ${servicesWithoutProviders.length} services have NO providers assigned.`);
      console.log('   Options:');
      console.log('   1. Assign existing providers to these services');
      console.log('   2. Set these services to isActive: false to hide them');
      console.log('   3. Recruit new providers for these service categories');
      console.log('');
    }

    if (servicesWithoutAvailableProviders.length > 0 && servicesWithoutProviders.length === 0) {
      console.log('⚠️  WARNING:');
      console.log(`   ${servicesWithoutAvailableProviders.length} services have providers but none are available.`);
      console.log('   Users can see these services but cannot book them.');
      console.log('   Consider setting these services to isActive: false temporarily.');
      console.log('');
    }

    if (servicesWithAvailableProviders === services.length) {
      console.log('✅ EXCELLENT:');
      console.log('   All active services have available providers!');
      console.log('   Your platform is ready for bookings.');
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Disconnected from database');
  }
}

main();

