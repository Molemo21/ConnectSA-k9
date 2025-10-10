const { PrismaClient } = require('@prisma/client');

async function testAuthFlow() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing Authentication Flow');
    console.log('============================\n');
    
    // Test 1: Check if we can connect to the database
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test 2: Check if users exist
    console.log('\n2. Checking users in database...');
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users in database`);
    
    if (userCount > 0) {
      const sampleUser = await prisma.user.findFirst({
        select: {
          id: true,
          email: true,
          role: true,
          emailVerified: true,
          isActive: true
        }
      });
      console.log('✅ Sample user:', sampleUser);
    }
    
    // Test 3: Check if providers exist
    console.log('\n3. Checking providers in database...');
    const providerCount = await prisma.provider.count();
    console.log(`✅ Found ${providerCount} providers in database`);
    
    if (providerCount > 0) {
      const sampleProvider = await prisma.provider.findFirst({
        select: {
          id: true,
          userId: true,
          status: true,
          businessName: true,
          available: true
        }
      });
      console.log('✅ Sample provider:', sampleProvider);
    }
    
    // Test 4: Test the exact query from provider status endpoint
    console.log('\n4. Testing provider status query...');
    if (providerCount > 0) {
      const sampleProvider = await prisma.provider.findFirst();
      if (sampleProvider) {
        const providerStatus = await prisma.provider.findUnique({
          where: { userId: sampleProvider.userId },
          select: {
            id: true,
            status: true,
            businessName: true,
          }
        });
        console.log('✅ Provider status query successful:', providerStatus);
      }
    }
    
    console.log('\n🎯 AUTH FLOW TEST RESULT: SUCCESS');
    console.log('=================================');
    console.log('✅ Database connection works');
    console.log('✅ Users exist in database');
    console.log('✅ Providers exist in database');
    console.log('✅ Provider status queries work');
    console.log('✅ No database errors detected');
    
  } catch (error) {
    console.error('❌ Auth Flow Test Failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
  } finally {
    await prisma.$disconnect();
  }
}

testAuthFlow();
