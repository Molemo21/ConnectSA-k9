#!/usr/bin/env node

/**
 * Test the discover-providers API endpoint to see what error is occurring
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function main() {
  console.log('🔍 Testing discover-providers query...\n');
  
  try {
    // Get a test service
    const service = await prisma.service.findFirst({
      where: { isActive: true },
    });
    
    if (!service) {
      console.log('❌ No active services found');
      return;
    }
    
    console.log(`✅ Testing with service: ${service.name} (${service.id})\n`);
    
    // Try the same query that discover-providers uses
    console.log('🔄 Running provider query (same as discover-providers API)...\n');
    
    const providers = await prisma.provider.findMany({
      where: {
        services: {
          some: { serviceId: service.id },
        },
        available: true,
        status: 'APPROVED',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            avatar: true,
          }
        },
        services: {
          where: { serviceId: service.id },
          include: {
            service: {
              select: {
                name: true,
                description: true,
                category: true,
              }
            }
          }
        },
        reviews: {
          include: {
            booking: {
              include: {
                client: {
                  select: {
                    name: true,
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        bookings: {
          where: { status: { not: 'CANCELLED' } },
          select: {
            id: true,
            scheduledDate: true,
            status: true,
          }
        },
        _count: {
          select: {
            reviews: true,
            bookings: {
              where: { status: 'COMPLETED' }
            }
          }
        }
      },
    });
    
    console.log(`✅ Query successful! Found ${providers.length} providers\n`);
    
    providers.forEach((provider, idx) => {
      console.log(`${idx + 1}. ${provider.businessName || 'N/A'}`);
      console.log(`   User: ${provider.user.name}`);
      console.log(`   Services: ${provider.services.length}`);
      console.log(`   Reviews: ${provider._count.reviews}`);
      console.log(`   Completed jobs: ${provider._count.bookings}`);
      console.log('');
    });
    
    console.log('✅ The discover-providers query works correctly!');
    console.log('   If you\'re still seeing errors in production, the issue might be:');
    console.log('   1. Vercel hasn\'t finished deploying the new build yet');
    console.log('   2. Browser cache needs clearing');
    console.log('   3. Different error than Prisma schema mismatch');
    
  } catch (error) {
    console.error('❌ Query failed with error:', error.message);
    console.error('Full error:', error);
    
    if (error.code === 'P2022') {
      console.log('\n⚠️ SCHEMA MISMATCH DETECTED!');
      console.log('   The Prisma client still expects columns that don\'t exist.');
      console.log('   Solution: Run `npx prisma generate` again locally and redeploy.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();

