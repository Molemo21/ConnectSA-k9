import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Try a simple query
    const userCount = await prisma.user.count();
    console.log('✅ Connection successful!');
    console.log(`Found ${userCount} users in the database`);
    
    // Get database version
    const result = await prisma.$queryRaw`SELECT version();`;
    console.log('\nDatabase version:', result);
    
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testConnection()
  .then(success => process.exit(success ? 0 : 1))
  .catch(() => process.exit(1));
