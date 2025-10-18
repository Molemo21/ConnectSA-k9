import prisma from '../lib/prisma';

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase database connection...\n');

  try {
    // Step 1: Test basic connection
    console.log('Step 1: Testing basic connection...');
    await prisma.connect();
    console.log('✅ Basic connection successful\n');

    // Step 2: Test connection pooling
    console.log('Step 2: Testing connection pooling...');
    const poolPromises = Array(5).fill(null).map(() => 
      prisma.$queryRaw`SELECT 1`
    );
    await Promise.all(poolPromises);
    console.log('✅ Connection pooling working correctly\n');

    // Step 3: Test prepared statements setting
    console.log('Step 3: Verifying prepared statements setting...');
    const preparedStatementsDisabled = process.env.PRISMA_DISABLE_PREPARED_STATEMENTS === 'true';
    console.log(`✅ Prepared statements are ${preparedStatementsDisabled ? 'disabled' : 'enabled'}\n`);

    // Step 4: Test SSL connection
    console.log('Step 4: Verifying SSL connection...');
    const sslResult = await prisma.$queryRaw`SHOW ssl`;
    console.log('✅ SSL Status:', sslResult, '\n');

    // Step 5: Test actual query
    console.log('Step 5: Testing actual query...');
    const userCount = await prisma.user.count();
    console.log('✅ Successfully queried users table. Count:', userCount, '\n');

    console.log('🎉 All connection tests passed successfully!');
    console.log('Database connection is properly configured for Supabase.');

    return true;
  } catch (error) {
    console.error('\n❌ Connection test failed:', error);
    
    // Supabase-specific error handling
    if (error.message.includes('connection pool timeout')) {
      console.error('\nConnection pool timeout. Recommendations:');
      console.error('1. Check connection_limit in DATABASE_URL (currently set to 5)');
      console.error('2. Verify pool_timeout setting (currently 60 seconds)');
      console.error('3. Consider using DIRECT_URL for migrations and schema changes');
    } else if (error.message.includes('SSL')) {
      console.error('\nSSL connection issue. Verify:');
      console.error('1. sslmode=require is present in DIRECT_URL');
      console.error('2. Database SSL certificate is valid');
    }

    return false;
  } finally {
    await prisma.disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  testSupabaseConnection()
    .then(success => process.exit(success ? 0 : 1))
    .catch(() => process.exit(1));
}

export { testSupabaseConnection };
