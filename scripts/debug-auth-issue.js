const { db } = require('../lib/db-utils');
const bcrypt = require('bcryptjs');

async function debugAuthIssue() {
  try {
    console.log('🔍 Debugging authentication issues...\n');

    // 1. Check if users exist
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        emailVerified: true,
        isActive: true,
        role: true,
        createdAt: true
      },
      take: 5
    });

    console.log('📊 Users in database:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Name: ${user.name}`);
      console.log(`   - Has Password: ${!!user.password}`);
      console.log(`   - Email Verified: ${user.emailVerified}`);
      console.log(`   - Is Active: ${user.isActive}`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - Created: ${user.createdAt}`);
      console.log('');
    });

    // 2. Test password verification for first user
    if (users.length > 0 && users[0].password) {
      const testUser = users[0];
      console.log(`🔐 Testing password verification for: ${testUser.email}`);
      
      // Test with common passwords
      const testPasswords = ['password', '123456', 'test123', 'admin', 'user123'];
      
      for (const testPassword of testPasswords) {
        try {
          const isValid = await bcrypt.compare(testPassword, testUser.password);
          console.log(`   - Password "${testPassword}": ${isValid ? '✅ VALID' : '❌ Invalid'}`);
        } catch (error) {
          console.log(`   - Password "${testPassword}": ❌ Error - ${error.message}`);
        }
      }
    }

    // 3. Check database connection
    console.log('\n🔌 Testing database connection...');
    const dbTest = await db.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful');

    // 4. Check environment variables
    console.log('\n🌍 Environment check:');
    console.log(`   - NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   - DATABASE_URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);
    console.log(`   - NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set'}`);

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await db.$disconnect();
  }
}

debugAuthIssue();
