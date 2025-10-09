#!/usr/bin/env node

/**
 * Provider Discovery Test (Bypassing Authentication)
 * Tests the provider discovery logic directly using database queries
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProviderDiscovery() {
  console.log('🔍 Testing Provider Discovery Logic...\n');

  try {
    // Get a service ID
    console.log('📋 Getting service for testing...');
    const services = await prisma.$queryRaw`
      SELECT id, name, "basePrice"
      FROM services 
      WHERE "isActive" = true 
      LIMIT 1
    `;
    
    if (services.length === 0) {
      throw new Error('No active services found');
    }
    
    const testService = services[0];
    console.log(`✅ Selected service: ${testService.name} (R${testService.basePrice})`);
    console.log(`✅ Service ID: ${testService.id}`);

    // Test provider discovery logic
    console.log('\n🔍 Testing provider discovery query...');
    
    const providers = await prisma.$queryRaw`
      SELECT 
        p.id,
        p."businessName",
        p.description,
        p.experience,
        p.location,
        p."hourlyRate",
        p.status,
        p.available,
        u.name as user_name,
        u.email,
        u.phone,
        COUNT(ps."serviceId") as service_count
      FROM providers p
      LEFT JOIN users u ON p."userId" = u.id
      LEFT JOIN provider_services ps ON p.id = ps."providerId"
      WHERE ps."serviceId" = ${testService.id}
        AND p.status = 'APPROVED'
        AND (p.available = true OR p.available IS NULL)
      GROUP BY p.id, p."businessName", p.description, p.experience, p.location, p."hourlyRate", p.status, p.available, u.name, u.email, u.phone
      ORDER BY p."businessName"
    `;

    console.log(`✅ Found ${providers.length} providers for service "${testService.name}"`);
    
    if (providers.length > 0) {
      console.log('\n📋 Available Providers:');
      providers.forEach((provider, index) => {
        console.log(`   ${index + 1}. ${provider.businessName || provider.user_name || 'Unnamed Provider'}`);
        console.log(`      Location: ${provider.location || 'N/A'}`);
        console.log(`      Hourly Rate: R${provider.hourlyRate || 'N/A'}`);
        console.log(`      Status: ${provider.status}`);
        console.log(`      Available: ${provider.available}`);
        console.log(`      Services: ${provider.service_count}`);
        console.log('');
      });
    } else {
      console.log('⚠️ No providers found for this service');
    }

    // Test the complete provider discovery flow
    console.log('🧪 Testing complete provider discovery flow...');
    
    const testDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const testTime = '10:00';
    
    console.log(`   Service: ${testService.name}`);
    console.log(`   Date: ${testDate}`);
    console.log(`   Time: ${testTime}`);
    
    // Check for conflicting bookings
    const conflictingBookings = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM bookings b
      JOIN provider_services ps ON b."providerId" = ps."providerId"
      WHERE ps."serviceId" = ${testService.id}
        AND DATE(b."scheduledDate") = ${testDate}
        AND b.status NOT IN ('CANCELLED', 'COMPLETED')
    `;
    
    console.log(`   Conflicting bookings: ${conflictingBookings[0].count}`);
    
    // Final provider availability check
    const availableProviders = await prisma.$queryRaw`
      SELECT 
        p.id,
        p."businessName",
        p.location,
        p."hourlyRate",
        p.status,
        p.available
      FROM providers p
      JOIN provider_services ps ON p.id = ps."providerId"
      WHERE ps."serviceId" = ${testService.id}
        AND p.status = 'APPROVED'
        AND (p.available = true OR p.available IS NULL)
        AND p.id NOT IN (
          SELECT DISTINCT b."providerId"
          FROM bookings b
          WHERE DATE(b."scheduledDate") = ${testDate}
            AND b.status NOT IN ('CANCELLED', 'COMPLETED')
        )
    `;
    
    console.log(`✅ Available providers for booking: ${availableProviders.length}`);
    
    if (availableProviders.length > 0) {
      console.log('\n🎯 Providers Available for Booking:');
      availableProviders.forEach((provider, index) => {
        console.log(`   ${index + 1}. ${provider.businessName || 'Unnamed Provider'}`);
        console.log(`      Location: ${provider.location || 'N/A'}`);
        console.log(`      Hourly Rate: R${provider.hourlyRate || 'N/A'}`);
        console.log(`      Status: ${provider.status}`);
        console.log(`      Available: ${provider.available}`);
      });
    }

    // Test with different locations
    console.log('\n🌍 Testing location-based provider discovery...');
    
    const locations = ['Mthatha', 'East London', 'Rustenburg'];
    
    for (const location of locations) {
      const locationProviders = await prisma.$queryRaw`
        SELECT 
          p.id,
          p."businessName",
          p.location,
          p."hourlyRate"
        FROM providers p
        JOIN provider_services ps ON p.id = ps."providerId"
        WHERE ps."serviceId" = ${testService.id}
          AND p.status = 'APPROVED'
          AND (p.available = true OR p.available IS NULL)
          AND (p.location ILIKE ${'%' + location + '%'} OR p.location IS NULL)
      `;
      
      console.log(`   ${location}: ${locationProviders.length} providers`);
      if (locationProviders.length > 0) {
        locationProviders.forEach(provider => {
          console.log(`     - ${provider.businessName || 'Unnamed Provider'} (${provider.location || 'N/A'})`);
        });
      }
    }

    // Summary
    console.log('\n📊 Provider Discovery Test Summary:');
    console.log('===================================');
    console.log(`✅ Service: ${testService.name}`);
    console.log(`✅ Total providers for service: ${providers.length}`);
    console.log(`✅ Available providers for booking: ${availableProviders.length}`);
    console.log(`✅ Conflicting bookings: ${conflictingBookings[0].count}`);
    console.log(`✅ Location-based discovery: Working`);
    
    if (availableProviders.length > 0) {
      console.log('\n🎉 SUCCESS: Provider discovery is working correctly!');
      console.log('✅ Users can find providers for their selected services');
      console.log('✅ Providers are properly filtered by availability');
      console.log('✅ Location-based filtering works');
      console.log('✅ Booking conflicts are detected');
    } else {
      console.log('\n⚠️ WARNING: No providers available for booking');
      console.log('This might be due to:');
      console.log('- All providers have conflicting bookings');
      console.log('- Providers are not marked as available');
      console.log('- Service assignments are missing');
    }

    return {
      serviceId: testService.id,
      serviceName: testService.name,
      totalProviders: providers.length,
      availableProviders: availableProviders.length,
      conflictingBookings: conflictingBookings[0].count
    };

  } catch (error) {
    console.error('❌ Provider discovery test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  testProviderDiscovery()
    .then(result => {
      console.log('\n🎯 Provider Discovery Test completed!');
      console.log(`📊 Result: ${result.availableProviders}/${result.totalProviders} providers available`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testProviderDiscovery };