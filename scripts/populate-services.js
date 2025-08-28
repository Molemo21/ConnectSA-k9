#!/usr/bin/env node

/**
 * Populate Services Table
 * 
 * This script populates the services table with common service types
 * that users can book through the platform.
 * 
 * Usage: node scripts/populate-services.js
 */

const { PrismaClient } = require('@prisma/client');

async function populateServices() {
  console.log('🔧 Populating Services Table\n');

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Check if services already exist
    const existingServices = await prisma.service.count();
    if (existingServices > 0) {
      console.log(`⚠️ Services table already has ${existingServices} services`);
      console.log('💡 Use --force flag to recreate all services\n');
      
      const services = await prisma.service.findMany({
        select: { id: true, name: true, category: true, isActive: true }
      });
      
      console.log('Current services:');
      services.forEach(service => {
        console.log(`   - ${service.name} (${service.category}) - ${service.isActive ? 'Active' : 'Inactive'}`);
      });
      console.log('');
      return;
    }

    // Define common services for the platform
    const servicesData = [
      // Cleaning Services
      {
        name: 'House Cleaning',
        description: 'Professional house cleaning services including dusting, vacuuming, and sanitizing',
        category: 'Cleaning',
        basePrice: 200.00
      },
      {
        name: 'Deep Cleaning',
        description: 'Comprehensive deep cleaning for move-in/move-out or special occasions',
        category: 'Cleaning',
        basePrice: 350.00
      },
      {
        name: 'Carpet Cleaning',
        description: 'Professional carpet and upholstery cleaning services',
        category: 'Cleaning',
        basePrice: 150.00
      },
      {
        name: 'Window Cleaning',
        description: 'Interior and exterior window cleaning services',
        category: 'Cleaning',
        basePrice: 120.00
      },

      // Plumbing Services
      {
        name: 'Plumbing Repair',
        description: 'General plumbing repairs and maintenance',
        category: 'Plumbing',
        basePrice: 300.00
      },
      {
        name: 'Pipe Installation',
        description: 'New pipe installation and plumbing system setup',
        category: 'Plumbing',
        basePrice: 450.00
      },
      {
        name: 'Drain Cleaning',
        description: 'Clogged drain clearing and maintenance',
        category: 'Plumbing',
        basePrice: 200.00
      },
      {
        name: 'Water Heater Service',
        description: 'Water heater installation, repair, and maintenance',
        category: 'Plumbing',
        basePrice: 400.00
      },

      // Electrical Services
      {
        name: 'Electrical Repair',
        description: 'General electrical repairs and troubleshooting',
        category: 'Electrical',
        basePrice: 250.00
      },
      {
        name: 'Wiring Installation',
        description: 'New electrical wiring and outlet installation',
        category: 'Electrical',
        basePrice: 350.00
      },
      {
        name: 'Lighting Installation',
        description: 'Light fixture and switch installation',
        category: 'Electrical',
        basePrice: 180.00
      },
      {
        name: 'Electrical Safety Inspection',
        description: 'Comprehensive electrical safety assessment',
        category: 'Electrical',
        basePrice: 200.00
      },

      // Gardening & Landscaping
      {
        name: 'Garden Maintenance',
        description: 'Regular garden upkeep including weeding, pruning, and watering',
        category: 'Gardening',
        basePrice: 150.00
      },
      {
        name: 'Lawn Mowing',
        description: 'Professional lawn mowing and edging services',
        category: 'Gardening',
        basePrice: 120.00
      },
      {
        name: 'Landscape Design',
        description: 'Custom landscape design and implementation',
        category: 'Gardening',
        basePrice: 500.00
      },
      {
        name: 'Tree Trimming',
        description: 'Professional tree pruning and maintenance',
        category: 'Gardening',
        basePrice: 250.00
      },

      // Handyman Services
      {
        name: 'General Repairs',
        description: 'Various household repairs and maintenance tasks',
        category: 'Handyman',
        basePrice: 180.00
      },
      {
        name: 'Furniture Assembly',
        description: 'Professional furniture assembly and setup',
        category: 'Handyman',
        basePrice: 100.00
      },
      {
        name: 'Painting',
        description: 'Interior and exterior painting services',
        category: 'Handyman',
        basePrice: 300.00
      },
      {
        name: 'Minor Renovations',
        description: 'Small renovation and improvement projects',
        category: 'Handyman',
        basePrice: 400.00
      },

      // Moving Services
      {
        name: 'Local Moving',
        description: 'Local moving and relocation services',
        category: 'Moving',
        basePrice: 400.00
      },
      {
        name: 'Furniture Moving',
        description: 'Professional furniture moving and placement',
        category: 'Moving',
        basePrice: 200.00
      },
      {
        name: 'Packing Services',
        description: 'Professional packing and unpacking assistance',
        category: 'Moving',
        basePrice: 150.00
      },

      // Pet Services
      {
        name: 'Pet Sitting',
        description: 'In-home pet care and supervision',
        category: 'Pet Services',
        basePrice: 120.00
      },
      {
        name: 'Dog Walking',
        description: 'Professional dog walking services',
        category: 'Pet Services',
        basePrice: 80.00
      },
      {
        name: 'Pet Grooming',
        description: 'Professional pet grooming and hygiene services',
        category: 'Pet Services',
        basePrice: 150.00
      }
    ];

    console.log(`🔧 Creating ${servicesData.length} services...\n`);

    // Create services one by one to avoid prepared statement issues
    let createdCount = 0;
    for (const serviceData of servicesData) {
      try {
        const service = await prisma.service.create({
          data: {
            ...serviceData,
            isActive: true
          }
        });
        
        createdCount++;
        console.log(`✅ Created: ${service.name} (${service.category})`);
        
        // Small delay between creations
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.error(`❌ Failed to create ${serviceData.name}:`, error.message);
        
        // Try to continue with other services
        continue;
      }
    }

    // Verify the services were created
    const totalServices = await prisma.service.count();
    console.log(`\n🎉 Successfully created ${createdCount} out of ${servicesData.length} services!`);
    console.log(`📊 Total services in database: ${totalServices}`);

    if (totalServices > 0) {
      // Show summary by category
      const servicesByCategory = await prisma.service.groupBy({
        by: ['category'],
        _count: { id: true }
      });

      console.log('\n📊 Services by category:');
      servicesByCategory.forEach(cat => {
        console.log(`   - ${cat.category}: ${cat._count.id} services`);
      });

      console.log('\n💡 Services are now available for booking in the platform');
      console.log('💡 Providers can now associate themselves with these services');
    } else {
      console.log('\n❌ No services were created. Please check the database connection and schema.');
    }

  } catch (error) {
    console.error('\n❌ Error populating services:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  populateServices();
}

module.exports = { populateServices };
