#!/usr/bin/env node

/**
 * Provider-Service Relationship Checker (Raw SQL)
 * Checks which providers are connected to which services using raw SQL
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProviderServicesRaw() {
  console.log('🔍 Checking Provider-Service Relationships (Raw SQL)...\n');

  try {
    // Get services using raw SQL
    console.log('📋 Fetching services...');
    const services = await prisma.$queryRaw`
      SELECT 
        s.id,
        s.name,
        s.description,
        s."basePrice",
        s."isActive",
        sc.name as category_name,
        sc.icon as category_icon
      FROM services s
      LEFT JOIN service_categories sc ON s."categoryId" = sc.id
      WHERE s."isActive" = true
      ORDER BY s.name
    `;

    console.log(`✅ Found ${services.length} active services\n`);

    // Get provider-service relationships using raw SQL
    console.log('🔗 Fetching provider-service relationships...');
    const providerServices = await prisma.$queryRaw`
      SELECT 
        ps.id,
        ps."providerId",
        ps."serviceId",
        ps."customRate"
      FROM provider_services ps
    `;

    console.log(`✅ Found ${providerServices.length} provider-service relationships\n`);

    // Get providers count
    console.log('👥 Checking for providers...');
    const providers = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM providers
    `;
    console.log(`✅ Found ${providers[0].count} providers in database\n`);

    // Group relationships by service
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
      console.log(`   Category: ${service.category_name || 'N/A'}`);
      console.log(`   Base Price: R${service.basePrice || 'N/A'}`);
      console.log(`   Providers: ${providerCount}`);
      
      if (providerCount === 0) {
        console.log('   ⚠️ No providers assigned');
      }
      console.log('');
    });

    // Summary
    console.log('📈 Summary:');
    console.log('===========');
    
    const servicesWithProviders = services.filter(s => (serviceProviderMap.get(s.id)?.length || 0) > 0);
    const servicesWithoutProviders = services.filter(s => (serviceProviderMap.get(s.id)?.length || 0) === 0);
    
    console.log(`Total Services: ${services.length}`);
    console.log(`Services with Providers: ${servicesWithProviders.length}`);
    console.log(`Services without Providers: ${servicesWithoutProviders.length}`);
    console.log(`Total Provider-Service Relationships: ${providerServices.length}`);
    console.log(`Total Providers: ${providers[0].count}`);
    console.log('');

    // Issues and recommendations
    if (servicesWithoutProviders.length > 0) {
      console.log('⚠️ ISSUES FOUND:');
      console.log('================');
      console.log('Services without providers:');
      servicesWithoutProviders.forEach(service => {
        console.log(`- ${service.name} (${service.category_name || 'N/A'})`);
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

    // Check provider details
    console.log('\n🔍 Checking Provider Details...');
    try {
      const providerDetails = await prisma.$queryRaw`
        SELECT 
          p.id,
          p."businessName",
          p.status,
          p.location,
          p."hourlyRate",
          COUNT(ps."serviceId") as service_count
        FROM providers p
        LEFT JOIN provider_services ps ON p.id = ps."providerId"
        GROUP BY p.id, p."businessName", p.status, p.location, p."hourlyRate"
        ORDER BY service_count DESC
        LIMIT 10
      `;
      
      if (providerDetails.length > 0) {
        console.log('Top Providers by Service Count:');
        providerDetails.forEach((provider, index) => {
          console.log(`${index + 1}. ${provider.businessName || 'Unnamed Provider'}`);
          console.log(`   Status: ${provider.status}`);
          console.log(`   Location: ${provider.location || 'N/A'}`);
          console.log(`   Hourly Rate: R${provider.hourlyRate || 'N/A'}`);
          console.log(`   Services: ${provider.service_count}`);
          console.log('');
        });
      } else {
        console.log('No providers found with service assignments');
      }
    } catch (error) {
      console.log('⚠️ Could not fetch provider details:', error.message);
    }

    // Check for providers without services
    console.log('\n🔍 Checking Providers without Services...');
    try {
      const providersWithoutServices = await prisma.$queryRaw`
        SELECT 
          p.id,
          p."businessName",
          p.status,
          p.location
        FROM providers p
        LEFT JOIN provider_services ps ON p.id = ps."providerId"
        WHERE ps."providerId" IS NULL
        LIMIT 10
      `;
      
      if (providersWithoutServices.length > 0) {
        console.log('Providers without any services:');
        providersWithoutServices.forEach((provider, index) => {
          console.log(`${index + 1}. ${provider.businessName || 'Unnamed Provider'}`);
          console.log(`   Status: ${provider.status}`);
          console.log(`   Location: ${provider.location || 'N/A'}`);
          console.log('');
        });
      } else {
        console.log('✅ All providers have at least one service assigned');
      }
    } catch (error) {
      console.log('⚠️ Could not check providers without services:', error.message);
    }

    return {
      totalServices: services.length,
      servicesWithProviders: servicesWithProviders.length,
      servicesWithoutProviders: servicesWithoutProviders.length,
      totalRelationships: providerServices.length,
      totalProviders: providers[0].count
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
  checkProviderServicesRaw()
    .then(result => {
      console.log('\n🎯 Provider-Service Check completed!');
      console.log(`📊 Result: ${result.servicesWithProviders}/${result.totalServices} services have providers`);
      console.log(`👥 Total Providers: ${result.totalProviders}`);
      console.log(`🔗 Total Relationships: ${result.totalRelationships}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkProviderServicesRaw };
