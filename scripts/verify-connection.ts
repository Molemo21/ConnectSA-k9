import prisma from '../lib/prisma';

async function verifyConnection() {
  console.log('🔍 Starting database connection verification...\n');

  try {
    // Step 1: Test basic connection
    console.log('Step 1: Testing basic connection...');
    await prisma.connect();
    console.log('✅ Basic connection successful\n');

    // Step 2: Verify database version
    console.log('Step 2: Checking database version...');
    const versionResult = await prisma.$queryRaw`SELECT version();`;
    console.log('✅ Database version:', versionResult, '\n');

    // Step 3: Test schema access
    console.log('Step 3: Testing schema access...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;
    console.log('✅ Found tables:', tables, '\n');

    // Step 4: Test query execution
    console.log('Step 4: Testing query execution...');
    const userCount = await prisma.user.count();
    console.log('✅ User count:', userCount, '\n');

    // Step 5: Test connection pool
    console.log('Step 5: Testing connection pool...');
    const concurrentQueries = await Promise.all([
      prisma.user.count(),
      prisma.service.count(),
      prisma.booking.count(),
      prisma.payment.count(),
      prisma.provider.count()
    ]);
    console.log('✅ Connection pool handling multiple queries successfully\n');

    // Final status
    console.log('🎉 All connection tests passed successfully!');
    console.log('Database connection is healthy and properly configured.');

    return true;
  } catch (error) {
    console.error('\n❌ Connection verification failed:', error);
    
    // Provide specific error guidance
    if (error.code === 'P1001') {
      console.error('\nAuthentication failed. Please check your database credentials.');
    } else if (error.code === 'P1017') {
      console.error('\nConnection timed out. Please check:');
      console.error('1. Database server is running');
      console.error('2. Connection string is correct');
      console.error('3. Network/firewall settings');
      console.error('4. Connection pool configuration');
    }

    return false;
  } finally {
    await prisma.disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  verifyConnection()
    .then(success => process.exit(success ? 0 : 1))
    .catch(() => process.exit(1));
}

export { verifyConnection };
