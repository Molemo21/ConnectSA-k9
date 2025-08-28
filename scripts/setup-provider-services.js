#!/usr/bin/env node

/**
 * Setup Provider-Service Relationships
 * 
 * This script creates test provider-service relationships so that
 * providers can offer services and users can complete bookings.
 * 
 * Usage: node scripts/setup-provider-services.js
 */

const { PrismaClient } = require('@prisma/client');

async function setupProviderServices() {
  console.log('🔧 Setting up Provider-Service Relationships\n');

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Check if provider services already exist
    const existingProviderServices = await prisma.providerService.count();
    if (existingProviderServices > 0) {
      console.log(`⚠️ Provider services table already has ${existingProviderServices} relationships`);
      console.log('💡 Use --force flag to recreate all relationships\n');
      
      const relationships = await prisma.providerService.findMany({
        include: {
          provider: {
            select: { businessName: true, status: true }
          },
          service: {
            select: { name: true, category: true }
          }
        }
      });
      
      console.log('Current provider-service relationships:');
      relationships.forEach(rel => {
        const businessName = rel.provider.businessName || 'Unnamed Provider';
        console.log(`   - ${businessName} offers ${rel.service.name} (${rel.service.category})`);
      });
      console.log('');
      return;
    }

    // Get all approved providers
    const approvedProviders = await prisma.provider.findMany({
      where: { status: 'APPROVED' },
      select: { id: true, businessName: true }
    });

    if (approvedProviders.length === 0) {
      console.log('❌ No approved providers found. Please approve some providers first.\n');
      return;
    }

    console.log(`📋 Found ${approvedProviders.length} approved providers:`);
    approvedProviders.forEach(provider => {
      const name = provider.businessName || 'Unnamed Provider';
      console.log(`   - ${name} (${provider.id})`);
    });

    // Get all active services
    const activeServices = await prisma.service.findMany({
      where: { isActive: true },
      select: { id: true, name: true, category: true, basePrice: true }
    });

    if (activeServices.length === 0) {
      console.log('❌ No active services found. Please populate services first.\n');
      return;
    }

    console.log(`\n🔧 Found ${activeServices.length} active services:`);
    activeServices.forEach(service => {
      console.log(`   - ${service.name} (${service.category}) - Base: R${service.basePrice || 'N/A'}`);
    });

    // Define realistic provider-service relationships based on business types
    const providerServiceMappings = [];

    // Provider 1: John's Services (likely a general handyman)
    const johnProvider = approvedProviders.find(p => p.businessName === "John's services");
    if (johnProvider) {
      // John offers general handyman services
      const handymanServices = activeServices.filter(s => 
        ['Handyman', 'Cleaning', 'Gardening'].includes(s.category)
      );
      handymanServices.forEach(service => {
        providerServiceMappings.push({
          providerId: johnProvider.id,
          serviceId: service.id,
          customRate: service.basePrice ? service.basePrice * 1.1 : null // 10% markup
        });
      });
    }

    // Provider 2: Another John's Services (different provider, same name)
    const johnProvider2 = approvedProviders.find(p => 
      p.businessName === "John's services" && p.id !== johnProvider?.id
    );
    if (johnProvider2) {
      // This John focuses on specialized services
      const specializedServices = activeServices.filter(s => 
        ['Plumbing', 'Electrical'].includes(s.category)
      );
      specializedServices.forEach(service => {
        providerServiceMappings.push({
          providerId: johnProvider2.id,
          serviceId: service.id,
          customRate: service.basePrice ? service.basePrice * 1.2 : null // 20% markup for specialized
        });
      });
    }

    // Provider 3: Unnamed but approved provider
    const unnamedProvider = approvedProviders.find(p => !p.businessName);
    if (unnamedProvider) {
      // This provider offers a variety of services
      const varietyServices = activeServices.filter(s => 
        ['Cleaning', 'Pet Services', 'Moving'].includes(s.category)
      );
      varietyServices.forEach(service => {
        providerServiceMappings.push({
          providerId: unnamedProvider.id,
          serviceId: service.id,
          customRate: service.basePrice ? service.basePrice * 0.9 : null // 10% discount to compete
        });
      });
    }

    if (providerServiceMappings.length === 0) {
      console.log('❌ No provider-service mappings could be created.\n');
      return;
    }

    console.log(`\n🔧 Creating ${providerServiceMappings.length} provider-service relationships...\n`);

    // Create provider-service relationships
    let createdCount = 0;
    for (const mapping of providerServiceMappings) {
      try {
        const relationship = await prisma.providerService.create({
          data: mapping
        });
        
        // Get service and provider details for logging
        const service = activeServices.find(s => s.id === mapping.serviceId);
        const provider = approvedProviders.find(p => p.id === mapping.providerId);
        const providerName = provider?.businessName || 'Unnamed Provider';
        
        createdCount++;
        console.log(`✅ ${providerName} now offers ${service?.name} (${service?.category})`);
        
        if (mapping.customRate) {
          console.log(`   💰 Custom rate: R${mapping.customRate.toFixed(2)}`);
        }
        
        // Small delay between creations
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.error(`❌ Failed to create relationship:`, error.message);
        continue;
      }
    }

    // Verify the relationships were created
    const totalRelationships = await prisma.providerService.count();
    console.log(`\n🎉 Successfully created ${createdCount} out of ${providerServiceMappings.length} relationships!`);
    console.log(`📊 Total provider-service relationships in database: ${totalRelationships}`);

    if (totalRelationships > 0) {
      // Show summary by provider
      const relationshipsByProvider = await prisma.providerService.groupBy({
        by: ['providerId'],
        _count: { id: true }
      });

      console.log('\n📊 Services offered by each provider:');
      for (const rel of relationshipsByProvider) {
        const provider = approvedProviders.find(p => p.id === rel.providerId);
        const providerName = provider?.businessName || 'Unnamed Provider';
        const services = await prisma.providerService.findMany({
          where: { providerId: rel.providerId },
          include: { service: { select: { name: true, category: true } } }
        });
        
        console.log(`\n   ${providerName}:`);
        services.forEach(ps => {
          console.log(`     - ${ps.service.name} (${ps.service.category})`);
        });
      }

      console.log('\n💡 Provider-service relationships are now set up!');
      console.log('💡 Users can now book services and find available providers');
      console.log('💡 The booking flow should work end-to-end');
    } else {
      console.log('\n❌ No relationships were created. Please check the database connection and schema.');
    }

  } catch (error) {
    console.error('\n❌ Error setting up provider services:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  setupProviderServices();
}

module.exports = { setupProviderServices };
