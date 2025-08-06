import { prisma } from '../lib/prisma-fixed';

async function testFixedConnection() {
  try {
    console.log('Testing fixed database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test simple query
    const users = await prisma.user.findMany({
      take: 1,
      select: { id: true, email: true }
    });
    console.log('✅ User query successful:', users);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Database disconnected');
  }
}

testFixedConnection(); 