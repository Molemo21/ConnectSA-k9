#!/usr/bin/env node

/**
 * Assign Existing Providers to Beauty Services in PRODUCTION Database
 * 
 * This script assigns existing approved providers to beauty services
 * so users can actually book beauty services with real providers.
 * 
 * Usage: node scripts/assign-providers-to-beauty-services-production.js
 */

const { PrismaClient } = require('@prisma/client');

async function assignProvidersToBeautyServicesInProduction() {
  console.log('👥 Assigning Existing Providers to Beauty Services in PRODUCTION Database\n');

  // Use production database URL
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    await prisma.$connect();
    console.log('✅ PRODUCTION Database connection successful\n');

    // Get all approved providers
    const providers = await prisma.provider.findMany({
      where: { 
        status: 'APPROVED',
        available: true
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        services: {
          include: {
            service: {
              select: {
                name: true,
                category: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`👥 Found ${providers.length} approved providers:`);
    providers.forEach((provider, index) => {
      const currentServices = provider.services.map(ps => ps.service.name).join(', ');
      console.log(`   ${index + 1}. ${provider.user?.name || 'Unknown'} (${provider.user?.email || 'No email'})`);
      console.log(`      Current services: ${currentServices || 'None'}`);
    });
    console.log('');

    // Get all beauty services
    const beautyCategory = await prisma.serviceCategory.findFirst({
      where: { name: 'Beauty & Personal Care' }
    });

    if (!beautyCategory) {
      throw new Error('Beauty & Personal Care category not found');
    }

    const beautyServices = await prisma.service.findMany({
      where: {
        categoryId: beautyCategory.id,
        isActive: true
      },
      orderBy: { name: 'asc' }
    });

    console.log(`💄 Found ${beautyServices.length} beauty services:`);
    beautyServices.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.name} - R${service.basePrice}`);
    });
    console.log('');

    if (providers.length === 0) {
      console.log('⚠️ No approved providers found. Cannot assign services.');
      return;
    }

    if (beautyServices.length === 0) {
      console.log('⚠️ No beauty services found. Cannot assign providers.');
      return;
    }

    console.log('🎯 Assignment Strategy:');
    console.log('   - Each provider will be assigned 2-4 beauty services');
    console.log('   - Services will be distributed evenly across providers');
    console.log('   - Custom rates will be set with ±20% variation from base price');
    console.log('   - Existing service assignments will be preserved');
    console.log('');

    let assignmentsCreated = 0;
    let assignmentsUpdated = 0;

    // Assign beauty services to providers
    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      
      // Calculate how many beauty services to assign to this provider (2-4 services)
      const servicesPerProvider = Math.min(4, Math.max(2, Math.ceil(beautyServices.length / providers.length)));
      const startIndex = (i * servicesPerProvider) % beautyServices.length;
      
      console.log(`👤 Assigning services to ${provider.user?.name || 'Provider'}:`);

      for (let j = 0; j < servicesPerProvider; j++) {
        const serviceIndex = (startIndex + j) % beautyServices.length;
        const service = beautyServices[serviceIndex];

        // Check if provider already has this service
        const existingAssignment = provider.services.find(ps => ps.serviceId === service.id);

        if (existingAssignment) {
          console.log(`   ✅ Already assigned: ${service.name}`);
          continue;
        }

        // Calculate custom rate with ±20% variation
        const variation = (Math.random() - 0.5) * 0.4; // -20% to +20%
        const customRate = Math.round(service.basePrice * (1 + variation) * 100) / 100;

        try {
          await prisma.providerService.create({
            data: {
              providerId: provider.id,
              serviceId: service.id,
              customRate: customRate
            }
          });

          console.log(`   ✅ Assigned: ${service.name} - R${customRate} (base: R${service.basePrice})`);
          assignmentsCreated++;
        } catch (error) {
          if (error.code === 'P2002') {
            // Unique constraint violation - already exists
            console.log(`   ⚠️ Already exists: ${service.name}`);
            assignmentsUpdated++;
          } else {
            console.log(`   ❌ Error assigning ${service.name}: ${error.message}`);
          }
        }
      }
      console.log('');
    }

    // Get final statistics
    const totalProviderServices = await prisma.providerService.count();
    const beautyProviderServices = await prisma.providerService.count({
      where: {
        service: {
          categoryId: beautyCategory.id
        }
      }
    });

    const providersWithBeautyServices = await prisma.provider.count({
      where: {
        status: 'APPROVED',
        services: {
          some: {
            service: {
              categoryId: beautyCategory.id
            }
          }
        }
      }
    });

    console.log('📊 Assignment Summary:');
    console.log(`   - New Assignments Created: ${assignmentsCreated}`);
    console.log(`   - Existing Assignments Found: ${assignmentsUpdated}`);
    console.log(`   - Total Provider-Service Relationships: ${totalProviderServices}`);
    console.log(`   - Beauty Service Assignments: ${beautyProviderServices}`);
    console.log(`   - Providers with Beauty Services: ${providersWithBeautyServices}/${providers.length}`);

    console.log('\n🎉 Provider assignment completed successfully!');
    console.log('💡 Users can now book beauty services with real providers.');
    console.log('🚀 The booking flow will work end-to-end for beauty services.');

  } catch (error) {
    console.error('❌ Error assigning providers to beauty services:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  assignProvidersToBeautyServicesInProduction()
    .then(() => {
      console.log('\n✅ Provider assignment script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Provider assignment script failed:', error);
      process.exit(1);
    });
}

module.exports = { assignProvidersToBeautyServicesInProduction };
