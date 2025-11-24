import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function promoteToAdmin() {
  const email = 'support@proliinkconnect.co.za';
  
  try {
    console.log(`🔍 Checking if user exists: ${email}`);
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log(`✅ User found. Current role: ${existingUser.role}`);
      
      // Update existing user to admin
      const user = await prisma.user.update({
        where: { email },
        data: { 
          role: UserRole.ADMIN,
          emailVerified: true, // Ensure verified
          isActive: true // Ensure active
        }
      });
      
      console.log('\n✅ User role updated to ADMIN successfully!');
      console.log('👤 User Details:');
      console.log({
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        isActive: user.isActive
      });
    } else {
      // Create new admin user
      console.log('⚠️  User does not exist. Creating new admin user...');
      
      const user = await prisma.user.create({
        data: {
          email,
          name: 'Support Administrator',
          role: UserRole.ADMIN,
          emailVerified: true,
          isActive: true,
          // Note: Password should be set via password reset flow
        }
      });
      
      console.log('\n✅ Admin user created successfully!');
      console.log('👤 User Details:');
      console.log({
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        isActive: user.isActive
      });
      console.log('\n⚠️  IMPORTANT: This user needs a password to log in.');
      console.log('   Options to set password:');
      console.log('   1. Use the "Forgot Password" feature on the login page');
      console.log('   2. Have an existing admin set it via the admin dashboard');
      console.log('   3. Use a database script to set it directly');
    }
    
    console.log('\n🎉 Process completed successfully!');
    console.log(`📧 ${email} now has ADMIN access.`);
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'P2002') {
      console.error('   User with this email already exists with conflicting data');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

promoteToAdmin();


