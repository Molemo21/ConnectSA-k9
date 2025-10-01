#!/usr/bin/env node

/**
 * Hide services that have no providers assigned
 * This prevents users from seeing services they can't book
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.qdrktzqfeewwcktgltzy:Motebangnakin@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=10&pool_timeout=60&connection_limit=5"
    }
  }
});

async function main() {
  console.log('🔍 Finding services without providers...\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to production database\n');

    // Get all active services with their provider count
    const services = await prisma.service.findMany({
      where: { isActive: true },
      include: {
        providers: {
          include: {
            provider: {
              select: {
                status: true,
                available: true,
              }
            }
          }
        }
      }
    });

    // Filter services without available providers
    const servicesWithoutProviders = services.filter(service => {
      const availableProviders = service.providers.filter(
        p => p.provider.status === 'APPROVED' && p.provider.available
      );
      return availableProviders.length === 0;
    });

    if (servicesWithoutProviders.length === 0) {
      console.log('✅ All active services have available providers!');
      console.log('   No action needed.');
      return;
    }

    console.log(`Found ${servicesWithoutProviders.length} services without available providers:\n`);
    servicesWithoutProviders.forEach((service, idx) => {
      console.log(`${idx + 1}. ${service.name} (${service.category})`);
      console.log(`   ID: ${service.id}`);
      console.log(`   Total providers: ${service.providers.length}`);
      console.log('');
    });

    console.log('These services will be hidden (set isActive: false)\n');
    console.log('⚠️  This will prevent users from seeing these services on the booking page.');
    console.log('⚠️  You can re-enable them later by setting isActive: true once providers are added.\n');

    // Update all services without providers to isActive: false
    const serviceIds = servicesWithoutProviders.map(s => s.id);
    
    const result = await prisma.service.updateMany({
      where: {
        id: { in: serviceIds }
      },
      data: {
        isActive: false
      }
    });

    console.log(`✅ Successfully hidden ${result.count} services!\n`);

    // Show what's still active
    const activeServices = await prisma.service.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        category: true
      },
      orderBy: { name: 'asc' }
    });

    console.log('📋 Services still visible to users:');
    console.log('='.repeat(60));
    activeServices.forEach((service, idx) => {
      console.log(`${(idx + 1).toString().padStart(2)}. ${service.name} (${service.category})`);
    });
    console.log('');

    console.log('✅ DONE! Users will now only see services with available providers.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

main();

