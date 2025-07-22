import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'password';
  const name = process.env.ADMIN_NAME || 'Admin User';

  if (!email || !password) {
    console.error(
      'Please provide ADMIN_EMAIL and ADMIN_PASSWORD as environment variables or arguments.'
    );
    process.exit(1);
  }

  try {
    const hashedPassword = await hashPassword(password);

    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: UserRole.ADMIN,
        emailVerified: true,
      },
    });

    console.log('Admin user created successfully:');
    console.log(admin);
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('Admin user with this email already exists.');
    } else {
      console.error('Error creating admin user:', error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
