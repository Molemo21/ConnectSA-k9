#!/usr/bin/env node

/**
 * Simple Provider-Service Checker
 * Checks provider-service relationships using raw SQL queries
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProviderServices() {
  console.log('🔍 Checking Provider-Service Relationships...\n');

  try {
    // Get services
    console.log('📋 Fetching services...');
    const services = await prisma.service.findMany({
      where: { isActive: true },
      include: {
        category: true
      }
    });

    console.log(`✅ Found ${services.length} active services\n`);

    // Get provider services
    console.log('🔗 Fetching provider-service relationships...');
    const providerServices = await prisma.providerService.findMany({
      include: {
        service: true
      }
    });

    console.log(`✅ Found ${providerServices.length} provider-service relationships\n`);

    // Group by service
    const serviceProviderMap = new Map();
    providerServices.forEach(ps => {
      if (!serviceProviderMap.has(ps.serviceId)) {
        serviceProviderMap.set(ps.serviceId, []);
      }
      serviceProviderMap.get(ps.serviceId).push(ps);
    });

    // Display services and their provider counts
    console.log('📊 Services and Provider Counts:');
    console.log('================================');
    
    services.forEach((service, index) => {
      const providerCount = serviceProviderMap.get(service.id)?.length || 0;
      console.log(`${index + 1}. ${service.name}`);
      console.log(`   Category: ${service.category?.name || 'N/A'}`);
      console.log(`   Base Price: R${service.basePrice || 'N/A'}`);
      console.log(`   Providers: ${providerCount}`);
      
      if (providerCount === 0) {
        console.log('   ⚠️ No providers assigned');
      }
      console.log('');
    });

    // Get providers (if they exist)
    console.log('👥 Checking for providers...');
    try {
      const providers = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM providers
      `;
      console.log(`✅ Found ${providers[0].count} providers in database`);
    } catch (error) {
      console.log('⚠️ Could not access providers table - may not exist');
    }

    // Summary
    console.log('📈 Summary:');
    console.log('===========');
    
    const servicesWithProviders = services.filter(s => (serviceProviderMap.get(s.id)?.length || 0) > 0);
    const servicesWithoutProviders = services.filter(s => (serviceProviderMap.get(s.id)?.length || 0) === 0);
    
    console.log(`Total Services: ${services.length}`);
    console.log(`Services with Providers: ${servicesWithProviders.length}`);
    console.log(`Services without Providers: ${servicesWithoutProviders.length}`);
    console.log(`Total Provider-Service Relationships: ${providerServices.length}`);
    console.log('');

    // Issues and recommendations
    if (servicesWithoutProviders.length > 0) {
      console.log('⚠️ ISSUES FOUND:');
      console.log('================');
      console.log('Services without providers:');
      servicesWithoutProviders.forEach(service => {
        console.log(`- ${service.name} (${service.category?.name || 'N/A'})`);
      });
      console.log('');
      
      console.log('💡 RECOMMENDATIONS:');
      console.log('===================');
      console.log('1. Assign providers to services that have none');
      console.log('2. Consider recruiting more providers for popular services');
      console.log('3. Review provider onboarding process');
      console.log('4. Check if providers are properly linked to services');
    } else {
      console.log('✅ All services have providers assigned!');
    }

    // Check if we can get provider details
    console.log('\n🔍 Checking Provider Details...');
    try {
      const providerDetails = await prisma.$queryRaw`
        SELECT 
          p.id,
          p."businessName",
          p.status,
          p.location,
          COUNT(ps."serviceId") as service_count
        FROM providers p
        LEFT JOIN provider_services ps ON p.id = ps."providerId"
        GROUP BY p.id, p."businessName", p.status, p.location
        ORDER BY service_count DESC
        LIMIT 10
      `;
      
      if (providerDetails.length > 0) {
        console.log('Top Providers by Service Count:');
        providerDetails.forEach((provider, index) => {
          console.log(`${index + 1}. ${provider.businessName || 'Unnamed Provider'}`);
          console.log(`   Status: ${provider.status}`);
          console.log(`   Location: ${provider.location || 'N/A'}`);
          console.log(`   Services: ${provider.service_count}`);
          console.log('');
        });
      }
    } catch (error) {
      console.log('⚠️ Could not fetch provider details:', error.message);
    }

    return {
      totalServices: services.length,
      servicesWithProviders: servicesWithProviders.length,
      servicesWithoutProviders: servicesWithoutProviders.length,
      totalRelationships: providerServices.length
    };

  } catch (error) {
    console.error('❌ Error checking provider-service relationships:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
if (require.main === module) {
  checkProviderServices()
    .then(result => {
      console.log('\n🎯 Provider-Service Check completed!');
      console.log(`📊 Result: ${result.servicesWithProviders}/${result.totalServices} services have providers`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkProviderServices };
