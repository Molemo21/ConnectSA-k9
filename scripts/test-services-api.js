const { PrismaClient } = require('@prisma/client');

async function testServicesAPI() {
  console.log('🔍 Testing Services API...');
  
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Check if services table exists and has data
    console.log('🔍 Checking services table...');
    const serviceCount = await prisma.service.count();
    console.log(`📊 Total services in database: ${serviceCount}`);

    if (serviceCount === 0) {
      console.log('⚠️ No services found in database. Running seed...');
      // Run the seed script
      const { exec } = require('child_process');
      exec('npx tsx prisma/seed.ts', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Seed failed:', error);
          return;
        }
        console.log('✅ Seed completed:', stdout);
        testServicesAfterSeed();
      });
    } else {
      // Test the actual query used by the API
      console.log('🔍 Testing services query...');
      const services = await prisma.service.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          category: true,
          description: true,
        },
        orderBy: { name: 'asc' },
      });

      console.log(`✅ Found ${services.length} active services:`);
      services.forEach((service, index) => {
        console.log(`  ${index + 1}. ${service.name} (${service.category}) - ID: ${service.id}`);
      });

      // Test the API endpoint directly
      console.log('🌐 Testing API endpoint...');
      const response = await fetch('http://localhost:3000/api/services');
      console.log(`📡 API Response Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ API returned ${data.length} services`);
        console.log('📋 API Response:', JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        console.log('❌ API Error:', errorText);
      }
    }

  } catch (error) {
    console.error('❌ Error testing services API:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

async function testServicesAfterSeed() {
  console.log('🔍 Testing services after seed...');
  
  const prisma = new PrismaClient();
  
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    });

    console.log(`✅ After seed: Found ${services.length} active services`);
    services.forEach((service, index) => {
      console.log(`  ${index + 1}. ${service.name} (${service.category}) - ID: ${service.id}`);
    });
  } catch (error) {
    console.error('❌ Error after seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testServicesAPI();
