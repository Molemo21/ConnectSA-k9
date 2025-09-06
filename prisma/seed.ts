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
      name: 'Cleaning Services',
      description: 'Professional cleaning services for homes and offices',
      category: 'cleaning',
      basePrice: 150.00,
    },
    {
      name: 'Plumbing Services',
      description: 'Plumbing repairs, installations, and maintenance',
      category: 'plumbing',
      basePrice: 300.00,
    },
    {
      name: 'Hair Styling & Beauty',
      description: 'Haircuts, styling, and beauty treatments',
      category: 'beauty',
      basePrice: 200.00,
    },
    {
      name: 'Electrical Services',
      description: 'Electrical repairs, installations, and maintenance',
      category: 'electrical',
      basePrice: 350.00,
    },
    {
      name: 'Gardening & Landscaping',
      description: 'Garden maintenance, landscaping, and tree services',
      category: 'gardening',
      basePrice: 250.00,
    },
    {
      name: 'Home Repairs',
      description: 'General home maintenance and repair services',
      category: 'home-repairs',
      basePrice: 275.00,
    },
    {
      name: 'Tutoring & Education',
      description: 'Private tutoring and educational services',
      category: 'education',
      basePrice: 180.00,
    },
    {
      name: 'Transport & Delivery',
      description: 'Transportation and delivery services',
      category: 'transport',
      basePrice: 120.00,
    },
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
