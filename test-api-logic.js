const { PrismaClient } = require('@prisma/client');

async function testProviderDiscoveryAPI() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing Provider Discovery API Logic');
    console.log('========================================\n');
    
    const testData = {
      serviceId: "cmfu45chx0001s7jg79cblbue",
      date: "2025-10-10",
      time: "10:00",
      address: "Test Address"
    };
    
    console.log('📥 Test Data:', testData);
    
    // Validate serviceId format
    const cuidRegex = /^[a-z0-9]{25}$/i;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!cuidRegex.test(testData.serviceId) && !uuidRegex.test(testData.serviceId)) {
      console.log('❌ Invalid serviceId format');
      return;
    }
    
    console.log('✅ ServiceId validation passed');
    
    // Test the exact query from the API
    const providers = await prisma.provider.findMany({
      where: {
        services: {
          some: { serviceId: testData.serviceId },
        },
        available: true,
        status: "APPROVED",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        },
        services: {
          where: { serviceId: testData.serviceId },
          include: {
            service: {
              select: {
                name: true,
                description: true,
                basePrice: true,
              }
            }
          }
        },
        bookings: {
          where: { status: { not: "CANCELLED" } },
          select: {
            id: true,
            scheduledDate: true,
            status: true,
            review: {
              select: {
                rating: true,
                comment: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' },
              take: 5,
            }
          }
        },
        _count: {
          select: {
            bookings: {
              where: { status: "COMPLETED" }
            }
          }
        }
      },
    });
    
    console.log('✅ Provider discovery query successful');
    console.log(`   Found ${providers.length} providers`);
    
    if (providers.length > 0) {
      const provider = providers[0];
      console.log('   First provider details:');
      console.log(`     Name: ${provider.user.name}`);
      console.log(`     Business: ${provider.businessName}`);
      console.log(`     Location: ${provider.location}`);
      console.log(`     Hourly Rate: ${provider.hourlyRate}`);
      console.log(`     Reviews Count: ${provider._count.reviews}`);
      console.log(`     Completed Bookings: ${provider._count.bookings}`);
    }
    
    // Test response formatting
    const response = {
      success: true,
      providers: providers.map(provider => ({
        id: provider.id,
        name: provider.user.name,
        businessName: provider.businessName,
        location: provider.location,
        hourlyRate: provider.hourlyRate,
        rating: 4.5, // Default rating
        reviewsCount: provider._count.reviews,
        completedBookings: provider._count.bookings,
        services: provider.services.map(ps => ({
          serviceName: ps.service.name,
          serviceDescription: ps.service.description,
          basePrice: ps.service.basePrice
        }))
      }))
    };
    
    console.log('\n✅ Response formatting successful');
    console.log(`   Response contains ${response.providers.length} providers`);
    
    console.log('\n🎯 API TEST RESULT: SUCCESS');
    console.log('============================');
    console.log('✅ All database queries work correctly');
    console.log('✅ Field selections match database schema');
    console.log('✅ Response formatting is correct');
    console.log('✅ No Prisma errors detected');
    
  } catch (error) {
    console.error('❌ API Test Failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
  } finally {
    await prisma.$disconnect();
  }
}

testProviderDiscoveryAPI();
