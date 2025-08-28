const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetSimplePassword() {
  try {
    console.log('🔑 Resetting Simple Test Password...\n');

    // Find the first CLIENT user
    const testUser = await prisma.user.findFirst({
      where: {
        role: 'CLIENT',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!testUser) {
      console.log('❌ No CLIENT user found');
      return;
    }

    console.log(`📋 Found user: ${testUser.name} (${testUser.email})`);
    
    // Set a very simple password
    const simplePassword = '123456';
    const hashedPassword = await bcrypt.hash(simplePassword, 12);

    await prisma.user.update({
      where: { id: testUser.id },
      data: { password: hashedPassword },
    });

    console.log('✅ Password reset successfully!');
    console.log('\n🔑 Login Credentials:');
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Password: ${simplePassword}`);
    console.log('\n🚀 Now you can:');
    console.log('   1. Go to http://localhost:3000/login');
    console.log('   2. Use the credentials above');
    console.log('   3. After login, try the provider discovery again');

  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the password reset
resetSimplePassword();
