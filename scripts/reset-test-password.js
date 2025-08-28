const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetTestPassword() {
  try {
    console.log('🔑 Resetting Test User Password...\n');

    // Find a CLIENT user with verified email
    const testUser = await prisma.user.findFirst({
      where: {
        role: 'CLIENT',
        emailVerified: true,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!testUser) {
      console.log('❌ No suitable test user found');
      return;
    }

    console.log(`📋 Found test user: ${testUser.name} (${testUser.email})`);

    // Generate a simple test password
    const testPassword = 'TestPassword123!';
    const hashedPassword = await bcrypt.hash(testPassword, 12);

    // Update the user's password
    await prisma.user.update({
      where: { id: testUser.id },
      data: { password: hashedPassword },
    });

    console.log('✅ Password reset successfully!');
    console.log('\n🔑 Login Credentials:');
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Password: ${testPassword}`);
    console.log('\n🚀 Now you can:');
    console.log('   1. Go to http://localhost:3000/login');
    console.log('   2. Use the credentials above');
    console.log('   3. After login, go to /dashboard');
    console.log('   4. Your existing bookings should appear!');

  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the password reset
resetTestPassword();
