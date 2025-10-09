#!/usr/bin/env node

/**
 * Provider-Service Relationship Checker
 * Checks which providers are connected to which services
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProviderServiceRelationships() {
  console.log('🔍 Checking Provider-Service Relationships...\n');

  try {
    // Get all services
    console.log('📋 Fetching all services...');
    const services = await prisma.service.findMany({
      where: { isActive: true },
      include: {
        category: true,
        providers: {
          include: {
            provider: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    console.log(`✅ Found ${services.length} active services\n`);

    // Display services and their providers
    services.forEach((service: any, index: number) => {
      console.log(`${index + 1}. ${service.name}`);
      console.log(`   Category: ${service.category?.name || 'N/A'}`);
      console.log(`   Base Price: R${service.basePrice || 'N/A'}`);
      console.log(`   Providers: ${service.providers.length}`);
      
      if (service.providers.length > 0) {
        service.providers.forEach((providerService: any, pIndex: number) => {
          const provider = providerService.provider;
          console.log(`     ${pIndex + 1}. ${provider.businessName || provider.user.name}`);
          console.log(`        Status: ${provider.status}`);
          console.log(`        Location: ${provider.location || 'N/A'}`);
          console.log(`        Hourly Rate: R${provider.hourlyRate || 'N/A'}`);
        });
      } else {
        console.log('     ⚠️ No providers assigned to this service');
      }
      console.log('');
    });

    // Get all providers
    console.log('👥 Fetching all providers...');
    const providers = await prisma.provider.findMany({
      include: {
        user: true,
        services: {
          include: {
            service: true
          }
        }
      }
    });

    console.log(`✅ Found ${providers.length} providers\n`);

    // Display providers and their services
    providers.forEach((provider: any, index: number) => {
      console.log(`${index + 1}. ${provider.businessName || provider.user.name}`);
      console.log(`   Status: ${provider.status}`);
      console.log(`   Location: ${provider.location || 'N/A'}`);
      console.log(`   Services: ${provider.services.length}`);
      
      if (provider.services.length > 0) {
        provider.services.forEach((providerService: any, sIndex: number) => {
          const service = providerService.service;
          console.log(`     ${sIndex + 1}. ${service.name} (R${service.basePrice || 'N/A'})`);
        });
      } else {
        console.log('     ⚠️ No services assigned to this provider');
      }
      console.log('');
    });

    // Summary statistics
    console.log('📊 Summary Statistics:');
    console.log('======================');
    
    const servicesWithProviders = services.filter((s: any) => s.providers.length > 0);
    const servicesWithoutProviders = services.filter((s: any) => s.providers.length === 0);
    const providersWithServices = providers.filter((p: any) => p.services.length > 0);
    const providersWithoutServices = providers.filter((p: any) => p.services.length === 0);
    
    console.log(`Total Services: ${services.length}`);
    console.log(`Services with Providers: ${servicesWithProviders.length}`);
    console.log(`Services without Providers: ${servicesWithoutProviders.length}`);
    console.log('');
    console.log(`Total Providers: ${providers.length}`);
    console.log(`Providers with Services: ${providersWithServices.length}`);
    console.log(`Providers without Services: ${providersWithoutServices.length}`);
    console.log('');

    // Check for issues
    if (servicesWithoutProviders.length > 0) {
      console.log('⚠️ ISSUES FOUND:');
      console.log('================');
      console.log('Services without providers:');
      servicesWithoutProviders.forEach((service: any) => {
        console.log(`- ${service.name} (${service.category?.name || 'N/A'})`);
      });
      console.log('');
    }

    if (providersWithoutServices.length > 0) {
      console.log('Providers without services:');
      providersWithoutServices.forEach((provider: any) => {
        console.log(`- ${provider.businessName || provider.user.name} (${provider.status})`);
      });
      console.log('');
    }

    // Recommendations
    console.log('💡 Recommendations:');
    console.log('===================');
    
    if (servicesWithoutProviders.length > 0) {
      console.log('1. Assign providers to services that have none');
      console.log('2. Consider recruiting more providers for popular services');
    }
    
    if (providersWithoutServices.length > 0) {
      console.log('3. Help providers select services they can offer');
      console.log('4. Review provider onboarding process');
    }
    
    if (servicesWithoutProviders.length === 0 && providersWithoutServices.length === 0) {
      console.log('✅ All services have providers and all providers have services!');
    }

    return {
      services,
      providers,
      servicesWithProviders: servicesWithProviders.length,
      servicesWithoutProviders: servicesWithoutProviders.length,
      providersWithServices: providersWithServices.length,
      providersWithoutServices: providersWithoutServices.length
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
  checkProviderServiceRelationships()
    .then(result => {
      console.log('\n🎯 Check completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkProviderServiceRelationships };
