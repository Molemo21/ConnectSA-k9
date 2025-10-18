#!/usr/bin/env node

/**
 * Add Beauty Services to PRODUCTION Database
 * 
 * This script adds beauty and personal care services to the PRODUCTION database
 * following the new dynamic category system.
 * 
 * Usage: node scripts/add-beauty-services-production.js
 */

const { PrismaClient } = require('@prisma/client');

async function addBeautyServicesToProduction() {
  console.log('💄 Adding Beauty Services to PRODUCTION Database\n');

  // Use production database URL
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    await prisma.$connect();
    console.log('✅ PRODUCTION Database connection successful\n');

    // First, create or find the Beauty & Personal Care category
    let beautyCategory = await prisma.serviceCategory.findFirst({
      where: { name: 'Beauty & Personal Care' }
    });

    if (!beautyCategory) {
      beautyCategory = await prisma.serviceCategory.create({
        data: {
          name: 'Beauty & Personal Care',
          description: 'Professional beauty and personal care services',
          icon: '💄',
          isActive: true
        }
      });
      console.log(`✅ Created Beauty category: ${beautyCategory.name} (${beautyCategory.id})\n`);
    } else {
      console.log(`✅ Found existing Beauty category: ${beautyCategory.name} (${beautyCategory.id})\n`);
    }

    // Define beauty services
    const beautyServices = [
      {
        name: 'Haircut',
        description: 'Professional haircut and styling services',
        basePrice: 150.00
      },
      {
        name: 'Barbering',
        description: 'Traditional barbering services including cuts and shaves',
        basePrice: 120.00
      },
      {
        name: 'Braiding',
        description: 'Professional hair braiding and styling services',
        basePrice: 200.00
      },
      {
        name: 'Weave Installation',
        description: 'Professional hair weave and extension installation',
        basePrice: 300.00
      },
      {
        name: 'Eyelash Extensions',
        description: 'Professional eyelash extension application',
        basePrice: 180.00
      },
      {
        name: 'Facial',
        description: 'Professional facial treatment and skincare services',
        basePrice: 220.00
      },
      {
        name: 'Waxing',
        description: 'Professional hair removal and waxing services',
        basePrice: 100.00
      },
      {
        name: 'Bridal Makeup',
        description: 'Professional bridal makeup and styling services',
        basePrice: 400.00
      },
      {
        name: 'Makeup Application',
        description: 'Professional makeup application for special occasions',
        basePrice: 200.00
      },
      {
        name: 'Manicure',
        description: 'Professional nail care and manicure services',
        basePrice: 120.00
      },
      {
        name: 'Pedicure',
        description: 'Professional foot care and pedicure services',
        basePrice: 150.00
      },
      {
        name: 'Nail Extensions',
        description: 'Professional nail extension and enhancement services',
        basePrice: 250.00
      }
    ];

    console.log(`📝 Adding ${beautyServices.length} beauty services to PRODUCTION...\n`);

    let addedCount = 0;
    let updatedCount = 0;

    // Add each beauty service
    for (const serviceData of beautyServices) {
      // Check if service already exists
      const existingService = await prisma.service.findFirst({
        where: {
          name: serviceData.name,
          categoryId: beautyCategory.id
        }
      });

      if (existingService) {
        // Update existing service
        const service = await prisma.service.update({
          where: { id: existingService.id },
          data: {
            description: serviceData.description,
            basePrice: serviceData.basePrice,
            isActive: true
          }
        });
        console.log(`🔄 Updated: ${service.name} - R${service.basePrice}`);
        updatedCount++;
      } else {
        // Create new service
        const service = await prisma.service.create({
          data: {
            name: serviceData.name,
            description: serviceData.description,
            categoryId: beautyCategory.id,
            basePrice: serviceData.basePrice,
            isActive: true
          }
        });
        console.log(`✅ Added: ${service.name} - R${service.basePrice}`);
        addedCount++;
      }
    }

    // Get final counts
    const totalServices = await prisma.service.count({
      where: { isActive: true }
    });

    const beautyServicesCount = await prisma.service.count({
      where: {
        isActive: true,
        categoryId: beautyCategory.id
      }
    });

    const totalCategories = await prisma.serviceCategory.count({
      where: { isActive: true }
    });

    console.log('\n📊 PRODUCTION Database Statistics:');
    console.log(`   - Total Categories: ${totalCategories}`);
    console.log(`   - Total Services: ${totalServices}`);
    console.log(`   - Beauty Services: ${beautyServicesCount}`);
    console.log(`   - Other Services: ${totalServices - beautyServicesCount}`);
    console.log(`   - Services Added: ${addedCount}`);
    console.log(`   - Services Updated: ${updatedCount}`);

    console.log('\n🎉 Beauty services successfully added to PRODUCTION database!');
    console.log('💡 The production frontend will now display both cleaning and beauty services.');
    console.log('🚀 Users can now book beauty services on the live platform!');

  } catch (error) {
    console.error('❌ Error adding beauty services to production:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  addBeautyServicesToProduction()
    .then(() => {
      console.log('\n✅ Production script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Production script failed:', error);
      process.exit(1);
    });
}

module.exports = { addBeautyServicesToProduction };
