const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('👥 Checking Users in Database...\n');

    // 1. Count all users
    const userCount = await prisma.user.count();
    console.log(`📊 Total users: ${userCount}`);

    if (userCount === 0) {
      console.log('❌ No users found in database');
      return;
    }

    // 2. Get all users with their roles
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('\n📋 User Details:');
    users.forEach((user, index) => {
      console.log(`\n  ${index + 1}. ${user.name} (${user.email})`);
      console.log(`     Role: ${user.role}`);
      console.log(`     Email Verified: ${user.emailVerified ? '✅' : '❌'}`);
      console.log(`     Active: ${user.isActive ? '✅' : '❌'}`);
      console.log(`     Created: ${user.createdAt.toISOString().split('T')[0]}`);
    });

    // 3. Check for CLIENT users specifically
    const clientUsers = users.filter(u => u.role === 'CLIENT');
    console.log(`\n👤 CLIENT users: ${clientUsers.length}`);
    
    if (clientUsers.length > 0) {
      console.log('✅ You have CLIENT users to test with');
      clientUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email})`);
      });
    } else {
      console.log('❌ No CLIENT users found');
      console.log('   You need a CLIENT user to test the dashboard');
    }

    // 4. Check for users with verified emails
    const verifiedUsers = users.filter(u => u.emailVerified);
    console.log(`\n✅ Email verified users: ${verifiedUsers.length}`);

    // 5. Check for active users
    const activeUsers = users.filter(u => u.isActive);
    console.log(`🟢 Active users: ${activeUsers.length}`);

    // 6. Show login recommendations
    console.log('\n🔑 Login Recommendations:');
    if (clientUsers.length > 0) {
      const bestUser = clientUsers.find(u => u.emailVerified && u.isActive) || clientUsers[0];
      console.log(`   Best user to test with: ${bestUser.name} (${bestUser.email})`);
      console.log(`   Role: ${bestUser.role}`);
      console.log(`   Email Verified: ${bestUser.emailVerified ? 'Yes' : 'No'}`);
      console.log(`   Active: ${bestUser.isActive ? 'Yes' : 'No'}`);
    } else {
      console.log('   ❌ No suitable users found for testing');
      console.log('   You need to create a CLIENT user first');
    }

  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkUsers();
