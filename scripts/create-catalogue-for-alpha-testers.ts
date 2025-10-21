import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Professional title templates for different service types
const titleTemplates = {
  'Cleaning': [
    'Basic Cleaning Package',
    'Deep Clean Service',
    'Premium Cleaning Solution',
    'Standard House Cleaning',
    'Complete Cleaning Service',
    'Professional Cleaning Package'
  ],
  'Gardening': [
    'Basic Garden Maintenance',
    'Complete Garden Care',
    'Premium Landscaping Service',
    'Standard Garden Cleanup',
    'Professional Garden Service',
    'Full Garden Maintenance'
  ],
  'Plumbing': [
    'Basic Plumbing Service',
    'Emergency Plumbing Fix',
    'Complete Plumbing Solution',
    'Standard Pipe Repair',
    'Professional Plumbing Service',
    'Full Plumbing Maintenance'
  ],
  'Electrical': [
    'Basic Electrical Service',
    'Complete Electrical Fix',
    'Professional Electrical Work',
    'Standard Wiring Service',
    'Emergency Electrical Repair',
    'Full Electrical Maintenance'
  ],
  'Painting': [
    'Basic Painting Service',
    'Complete Paint Job',
    'Professional Painting Work',
    'Standard Wall Painting',
    'Premium Painting Service',
    'Full Interior Painting'
  ],
  'Carpentry': [
    'Basic Carpentry Service',
    'Complete Woodwork Solution',
    'Professional Carpentry Work',
    'Standard Furniture Repair',
    'Custom Carpentry Service',
    'Full Carpentry Maintenance'
  ],
  'default': [
    'Basic Service Package',
    'Complete Service Solution',
    'Professional Service Work',
    'Standard Service Package',
    'Premium Service Solution',
    'Full Service Maintenance'
  ]
};

// Professional description templates
const descriptionTemplates = {
  short: [
    'Professional service with quality guaranteed',
    'Expert service delivered with care and precision',
    'Reliable service you can trust',
    'Quality service at competitive rates',
    'Professional service with attention to detail',
    'Expert service with guaranteed satisfaction'
  ],
  long: [
    'Our professional service includes all essential tasks using industry-standard equipment and techniques. We ensure the highest quality results for your specific needs.',
    'This comprehensive service package delivers expert results with professional-grade tools and methods. Our experienced team guarantees quality workmanship.',
    'Professional service solution that combines expertise with modern techniques. We provide reliable, high-quality results tailored to your requirements.',
    'Complete service package featuring professional equipment and skilled technicians. We deliver consistent, quality results with attention to detail.',
    'Expert service delivery using proven methods and professional tools. Our team ensures quality workmanship and customer satisfaction.',
    'Professional service solution with comprehensive coverage and quality assurance. We use industry best practices to deliver excellent results.'
  ]
};

// Duration options (in minutes)
const durationOptions = [30, 45, 60, 90, 120, 150, 180];

// Pricing multipliers for different package tiers
const pricingMultipliers = {
  basic: 0.8,    // 20% discount for basic
  standard: 1.0, // Full price for standard
  premium: 1.3   // 30% premium for premium
};

// Package tier names
const packageTiers = ['Basic', 'Standard', 'Premium'];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getServiceCategory(serviceName: string): string {
  const name = serviceName.toLowerCase();
  if (name.includes('clean')) return 'Cleaning';
  if (name.includes('garden') || name.includes('landscape')) return 'Gardening';
  if (name.includes('plumb')) return 'Plumbing';
  if (name.includes('electric')) return 'Electrical';
  if (name.includes('paint')) return 'Painting';
  if (name.includes('carpent') || name.includes('wood')) return 'Carpentry';
  return 'default';
}

function generateCatalogueItem(provider: any, service: any, tier: string, index: number) {
  const serviceCategory = getServiceCategory(service.name);
  const hourlyRate = provider.hourlyRate || 150;
  const multiplier = pricingMultipliers[tier.toLowerCase() as keyof typeof pricingMultipliers];
  const basePrice = Math.round(hourlyRate * multiplier);
  
  // Add some randomization to pricing (±10%)
  const priceVariation = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
  const finalPrice = Math.round(basePrice * priceVariation);
  
  const duration = getRandomElement(durationOptions);
  const titleTemplate = getRandomElement(titleTemplates[serviceCategory as keyof typeof titleTemplates] || titleTemplates.default);
  const shortDesc = getRandomElement(descriptionTemplates.short);
  const longDesc = getRandomElement(descriptionTemplates.long);
  
  return {
    providerId: provider.id,
    serviceId: service.id,
    title: `${tier} ${titleTemplate}`,
    shortDesc: `${shortDesc} - ${tier.toLowerCase()} package`,
    longDesc: `${longDesc} This ${tier.toLowerCase()} package is designed to meet your specific needs with professional quality and reliable service.`,
    price: finalPrice,
    currency: 'ZAR',
    durationMins: duration,
    images: [], // Empty for now, they can add later
    isActive: true // Make it bookable immediately
  };
}

async function createCatalogueForAlphaTesters() {
  try {
    console.log('🚀 Creating catalogue items for alpha testers...\n');
    
    // Get all approved providers
    const providers = await prisma.provider.findMany({
      where: {
        status: 'APPROVED',
        available: true
      },
      include: {
        user: true,
        services: {
          include: {
            service: true
          }
        },
        catalogueItems: true
      }
    });

    console.log(`📊 Found ${providers.length} approved providers\n`);

    let totalCreated = 0;
    let totalSkipped = 0;
    let totalServices = 0;

    for (const provider of providers) {
      console.log(`👤 Processing provider: ${provider.businessName || provider.user.name}`);
      console.log(`   💰 Hourly Rate: R${provider.hourlyRate || 150}`);
      console.log(`   🏷️  Services: ${provider.services.length}`);
      console.log(`   📦 Existing Catalogue Items: ${provider.catalogueItems.length}`);
      
      // Skip if provider already has catalogue items
      if (provider.catalogueItems.length > 0) {
        console.log(`   ⏭️  Skipping - already has ${provider.catalogueItems.length} catalogue items\n`);
        totalSkipped++;
        continue;
      }

      // Create 3 catalogue items for each service they offer
      for (const providerService of provider.services) {
        const service = providerService.service;
        totalServices++;
        
        console.log(`   🏷️  Creating 3 packages for: ${service.name}`);
        
        // Create Basic, Standard, and Premium packages
        for (let i = 0; i < 3; i++) {
          const tier = packageTiers[i];
          const catalogueData = generateCatalogueItem(provider, service, tier, i);
          
          const catalogueItem = await prisma.catalogueItem.create({
            data: catalogueData
          });

          console.log(`     ✅ ${tier}: "${catalogueItem.title}" - R${catalogueItem.price} (${catalogueItem.durationMins}min)`);
          totalCreated++;
        }
      }
      
      console.log(''); // Empty line for readability
    }

    console.log('🎉 Catalogue creation completed!\n');
    console.log('📊 Summary:');
    console.log(`   - ${totalCreated} catalogue items created`);
    console.log(`   - ${totalServices} services processed`);
    console.log(`   - ${totalSkipped} providers skipped (already had items)`);
    console.log(`   - ${providers.length} total providers processed`);
    console.log(`   - Average: ${Math.round(totalCreated / totalServices)} items per service`);

    // Show some sample created items
    console.log('\n📦 Sample Created Items:');
    const sampleItems = await prisma.catalogueItem.findMany({
      take: 5,
      include: {
        provider: {
          include: {
            user: true
          }
        },
        service: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    sampleItems.forEach((item, index) => {
      console.log(`   ${index + 1}. "${item.title}"`);
      console.log(`      Provider: ${item.provider.businessName || item.provider.user.name}`);
      console.log(`      Service: ${item.service.name}`);
      console.log(`      Price: R${item.price} (${item.durationMins}min)`);
      console.log(`      Description: ${item.shortDesc}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error creating catalogue items:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createCatalogueForAlphaTesters()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

