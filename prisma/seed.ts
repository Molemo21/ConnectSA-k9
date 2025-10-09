import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create default admin user
  console.log('👤 Creating admin user...');
  
  const adminEmail = 'admin@proliinkconnect.co.za';
  const adminPassword = 'AdminPass123!'; // In production, this should be set via env
  
  // Hash the password
  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      role: UserRole.ADMIN,
      emailVerified: true,
      isActive: true,
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: 'System Administrator',
      role: UserRole.ADMIN,
      emailVerified: true,
      isActive: true,
    },
  });

  console.log(`✅ Admin user created/updated: ${adminUser.email}`);

  // 2. Create baseline service categories
  console.log('🔧 Creating service categories...');
  
  const serviceCategories = [
    {
      name: 'House Cleaning',
      description: 'Professional house cleaning services including dusting, vacuuming, and sanitizing',
      category: 'cleaning',
      basePrice: 350.00,
    },
    {
      name: 'Window Cleaning',
      description: 'Interior and exterior window cleaning services',
      category: 'cleaning',
      basePrice: 300.00,
    },
    {
      name: 'Deep Cleaning',
      description: 'Comprehensive deep cleaning for move-in/move-out or special occasions',
      category: 'cleaning',
      basePrice: 600.00,
    },
    {
      name: 'Carpet Cleaning',
      description: 'Professional carpet and upholstery cleaning services',
      category: 'cleaning',
      basePrice: 400.00,
    }
  ];

  let createdServices = 0;
  let updatedServices = 0;

  for (const serviceData of serviceCategories) {
    // Check if service exists by name first
    const existingService = await prisma.service.findFirst({
      where: { name: serviceData.name }
    });

    const service = existingService 
      ? await prisma.service.update({
          where: { id: existingService.id },
          data: {
            description: serviceData.description,
            basePrice: serviceData.basePrice,
            isActive: true,
          },
        })
      : await prisma.service.create({
          data: {
            name: serviceData.name,
            description: serviceData.description,
            category: serviceData.category,
            basePrice: serviceData.basePrice,
            mainCategory: 'HOME_SERVICES',
            isActive: true,
          },
        });

    if (service.createdAt.getTime() === service.updatedAt.getTime()) {
      createdServices++;
    } else {
      updatedServices++;
    }
  }

  console.log(`✅ Services created: ${createdServices}, updated: ${updatedServices}`);

  // 3. Verify admin user exists and is active
  const adminCheck = await prisma.user.findFirst({
    where: {
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  if (!adminCheck) {
    throw new Error('❌ No active admin user found after seeding!');
  }

  console.log(`✅ Admin verification: Found active admin (${adminCheck.email})`);

  // 4. Display seeding summary
  const totalUsers = await prisma.user.count();
  const totalServices = await prisma.service.count();
  const activeServices = await prisma.service.count({ where: { isActive: true } });

  console.log('\n📊 Seeding Summary:');
  console.log(`   👥 Total users: ${totalUsers}`);
  console.log(`   🔧 Total services: ${totalServices}`);
  console.log(`   ✅ Active services: ${activeServices}`);
  console.log(`   👑 Admin users: ${await prisma.user.count({ where: { role: UserRole.ADMIN } })}`);

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n🔐 Admin credentials:');
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log('\n⚠️  IMPORTANT: Change admin password in production!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });