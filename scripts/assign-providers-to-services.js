#!/usr/bin/env node

/**
 * Provider-Service Assignment Script
 * Assigns providers to appropriate cleaning services
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function assignProvidersToServices() {
  console.log('🔧 Assigning Providers to Services...\n');

  try {
    // Get all approved providers
    console.log('👥 Fetching approved providers...');
    const providers = await prisma.$queryRaw`
      SELECT 
        p.id,
        p."businessName",
        p.status,
        p.location,
        p."hourlyRate"
      FROM providers p
      WHERE p.status = 'APPROVED'
      ORDER BY p."businessName"
    `;

    console.log(`✅ Found ${providers.length} approved providers\n`);

    // Get all cleaning services
    console.log('🧹 Fetching cleaning services...');
    const services = await prisma.$queryRaw`
      SELECT 
        s.id,
        s.name,
        s."basePrice"
      FROM services s
      WHERE s."isActive" = true
      ORDER BY s.name
    `;

    console.log(`✅ Found ${services.length} active services\n`);

    if (providers.length === 0) {
      console.log('⚠️ No approved providers found. Cannot assign services.');
      return;
    }

    if (services.length === 0) {
      console.log('⚠️ No active services found. Cannot assign providers.');
      return;
    }

    // Clear existing assignments
    console.log('🗑️ Clearing existing provider-service assignments...');
    await prisma.$queryRaw`
      DELETE FROM provider_services
    `;
    console.log('✅ Existing assignments cleared\n');

    // Assign each provider to all cleaning services
    console.log('🔗 Assigning providers to services...');
    let assignmentCount = 0;

    for (const provider of providers) {
      console.log(`📝 Assigning ${provider.businessName || 'Unnamed Provider'} to services...`);
      
      for (const service of services) {
        try {
          await prisma.$queryRaw`
            INSERT INTO provider_services (id, "providerId", "serviceId")
            VALUES (gen_random_uuid()::text, ${provider.id}, ${service.id})
          `;
          assignmentCount++;
          console.log(`   ✅ Assigned to ${service.name}`);
        } catch (error) {
          console.log(`   ❌ Failed to assign to ${service.name}: ${error.message}`);
        }
      }
      console.log('');
    }

    console.log(`🎉 Assignment completed! Created ${assignmentCount} provider-service relationships\n`);

    // Verify assignments
    console.log('🔍 Verifying assignments...');
    const verification = await prisma.$queryRaw`
      SELECT 
        s.name as service_name,
        COUNT(ps."providerId") as provider_count
      FROM services s
      LEFT JOIN provider_services ps ON s.id = ps."serviceId"
      WHERE s."isActive" = true
      GROUP BY s.id, s.name
      ORDER BY s.name
    `;

    console.log('📊 Service Assignment Summary:');
    console.log('==============================');
    verification.forEach(item => {
      console.log(`${item.service_name}: ${item.provider_count} providers`);
    });

    // Check provider assignments
    const providerVerification = await prisma.$queryRaw`
      SELECT 
        p."businessName",
        COUNT(ps."serviceId") as service_count
      FROM providers p
      LEFT JOIN provider_services ps ON p.id = ps."providerId"
      WHERE p.status = 'APPROVED'
      GROUP BY p.id, p."businessName"
      ORDER BY p."businessName"
    `;

    console.log('\n👥 Provider Assignment Summary:');
    console.log('================================');
    providerVerification.forEach(item => {
      console.log(`${item.businessName || 'Unnamed Provider'}: ${item.service_count} services`);
    });

    console.log('\n✅ Provider-Service assignments completed successfully!');
    console.log('\n🚀 Next Steps:');
    console.log('1. Test the booking flow with assigned providers');
    console.log('2. Verify service discovery works');
    console.log('3. Check provider availability in booking process');

    return {
      providersAssigned: providers.length,
      servicesAssigned: services.length,
      totalAssignments: assignmentCount
    };

  } catch (error) {
    console.error('❌ Error assigning providers to services:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the assignment
if (require.main === module) {
  assignProvidersToServices()
    .then(result => {
      console.log('\n🎯 Assignment completed successfully!');
      console.log(`📊 Result: ${result.totalAssignments} assignments created`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Assignment failed:', error);
      process.exit(1);
    });
}

module.exports = { assignProvidersToServices };
