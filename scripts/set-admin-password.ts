import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setAdminPassword() {
  const email = 'support@proliinkconnect.co.za';
  
  // Get password from environment variable or command line argument
  const password = process.env.ADMIN_PASSWORD || process.argv[2];
  
  if (!password) {
    console.error('❌ Error: Password is required!');
    console.log('\n📝 Usage Options:');
    console.log('   1. Set environment variable:');
    console.log('      ADMIN_PASSWORD="YourPassword123!" npx tsx scripts/set-admin-password.ts');
    console.log('\n   2. Pass as argument:');
    console.log('      npx tsx scripts/set-admin-password.ts "YourPassword123!"');
    console.log('\n⚠️  Security Note: Using environment variable is more secure');
    console.log('   as it won\'t appear in your command history.');
    process.exit(1);
  }

  // Validate password strength (basic check)
  if (password.length < 8) {
    console.error('❌ Error: Password must be at least 8 characters long');
    process.exit(1);
  }

  try {
    console.log(`🔍 Looking up user: ${email}`);
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    });

    if (!user) {
      console.error(`❌ Error: User with email ${email} not found!`);
      console.log('   Please run scripts/promote-to-admin.ts first to create the admin account.');
      process.exit(1);
    }

    console.log(`✅ User found: ${user.name} (${user.role})`);
    console.log('🔐 Hashing password...');
    
    // Hash the password with 12 salt rounds (matching other scripts)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update the user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    console.log('\n✅ Password set successfully!');
    console.log('\n👤 Account Details:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log('\n🔑 Login Credentials:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${password}`);
    console.log('\n🚀 Next Steps:');
    console.log('   1. Go to your login page');
    console.log('   2. Use the credentials above to log in');
    console.log('   3. You will have full admin access');
    console.log('\n⚠️  IMPORTANT: Keep these credentials secure!');
    console.log('   Consider changing the password after first login.');
    
  } catch (error: any) {
    console.error('\n❌ Error setting password:', error.message);
    if (error.code === 'P2025') {
      console.error('   User not found in database');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setAdminPassword();


