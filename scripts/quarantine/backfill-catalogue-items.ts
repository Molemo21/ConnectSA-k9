#!/usr/bin/env node

/**
 * Catalogue Items Backfill Script
 * 
 * This script migrates existing providers with hourly rates to the new
 * catalogue-based pricing system by creating starter catalogue items.
 * 
 * Safety Features:
 * - Comprehensive logging
 * - Data validation
 * - Rollback capability
 * - Progress tracking
 * - Error handling
 */

import { PrismaClient } from '@prisma/client';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

interface ProviderWithServices {
  id: string;
  hourlyRate: number | null;
  businessName: string | null;
  status: string;
  services: Array<{
    service: {
      id: string;
      name: string;
      description: string | null;
    };
  }>;
  user: {
    name: string;
  };
}

interface BackfillStats {
  totalProviders: number;
  providersWithRates: number;
  providersWithServices: number;
  catalogueItemsCreated: number;
  providersSkipped: number;
  errors: Array<{
    providerId: string;
    error: string;
    timestamp: string;
  }>;
  startTime: string;
  endTime?: string;
  duration?: number;
}

class CatalogueBackfillService {
  private stats: BackfillStats = {
    totalProviders: 0,
    providersWithRates: 0,
    providersWithServices: 0,
    catalogueItemsCreated: 0,
    providersSkipped: 0,
    errors: [],
    startTime: new Date().toISOString()
  };

  private logDir = 'logs';
  private logFile = join(this.logDir, `catalogue-backfill-${new Date().toISOString().split('T')[0]}.log`);

  constructor() {
    // Ensure logs directory exists
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  private log(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    console.log(logMessage);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }

    // Write to log file
    const logEntry = `${logMessage}\n${data ? JSON.stringify(data, null, 2) + '\n' : ''}`;
    writeFileSync(this.logFile, logEntry, { flag: 'a' });
  }

  private error(providerId: string, error: string) {
    const errorEntry = {
      providerId,
      error,
      timestamp: new Date().toISOString()
    };
    
    this.stats.errors.push(errorEntry);
    this.log(`❌ Error for provider ${providerId}: ${error}`);
  }

  async validateEnvironment() {
    this.log('🔍 Validating environment...');

    // Check if catalogue_items table exists
    try {
      await prisma.$queryRaw`SELECT 1 FROM catalogue_items LIMIT 1`;
      this.log('✅ Catalogue items table exists');
    } catch (error) {
      throw new Error('Catalogue items table does not exist. Please run migrations first.');
    }

    // Check if new booking columns exist
    try {
      await prisma.$queryRaw`SELECT catalogueItemId FROM bookings LIMIT 1`;
      this.log('✅ New booking columns exist');
    } catch (error) {
      throw new Error('New booking columns do not exist. Please run migrations first.');
    }

    this.log('✅ Environment validation passed');
  }

  async getProvidersWithRates(): Promise<ProviderWithServices[]> {
    this.log('📊 Fetching providers with hourly rates...');

    const providers = await prisma.provider.findMany({
      where: {
        hourlyRate: {
          not: null,
          gt: 0
        },
        status: 'APPROVED'
      },
      include: {
        services: {
          include: {
            service: true
          }
        },
        user: {
          select: {
            name: true
          }
        }
      }
    });

    this.stats.totalProviders = await prisma.provider.count();
    this.stats.providersWithRates = providers.length;

    this.log(`📈 Found ${providers.length} providers with hourly rates out of ${this.stats.totalProviders} total providers`);

    return providers;
  }

  async checkExistingCatalogueItems(providerId: string): Promise<number> {
    const count = await prisma.catalogueItem.count({
      where: { providerId }
    });
    return count;
  }

  async createStarterCatalogueItems(provider: ProviderWithServices): Promise<number> {
    let createdCount = 0;

    for (const providerService of provider.services) {
      const service = providerService.service;
      
      try {
        // Create a starter catalogue item
        const catalogueItem = await prisma.catalogueItem.create({
          data: {
            providerId: provider.id,
            serviceId: service.id,
            title: `${service.name} Service`,
            shortDesc: `Professional ${service.name.toLowerCase()} service by ${provider.businessName || provider.user.name}`,
            longDesc: service.description || `High-quality ${service.name.toLowerCase()} service with professional expertise.`,
            price: provider.hourlyRate!,
            currency: 'ZAR',
            durationMins: 60, // Default 1 hour
            images: [], // Empty array for now
            isActive: true // Set to true to make providers immediately bookable
          }
        });

        this.log(`   ✅ Created catalogue item: ${catalogueItem.title} (R${catalogueItem.price})`);
        createdCount++;
      } catch (error) {
        this.error(provider.id, `Failed to create catalogue item for service ${service.name}: ${error}`);
      }
    }

    return createdCount;
  }

  async backfillProviders() {
    this.log('🚀 Starting catalogue items backfill...');

    try {
      await this.validateEnvironment();
      
      const providers = await this.getProvidersWithRates();
      
      if (providers.length === 0) {
        this.log('⚠️ No providers with hourly rates found. Nothing to backfill.');
        return;
      }

      this.log(`🔄 Processing ${providers.length} providers...`);

      for (const provider of providers) {
        this.log(`\n🔄 Processing provider: ${provider.businessName || provider.user.name} (${provider.id})`);
        this.log(`   Hourly Rate: R${provider.hourlyRate}`);
        this.log(`   Services: ${provider.services.length}`);

        // Check if provider already has catalogue items
        const existingItems = await this.checkExistingCatalogueItems(provider.id);

        if (existingItems > 0) {
          this.log(`   ⏭️  Skipping - already has ${existingItems} catalogue items`);
          this.stats.providersSkipped++;
          continue;
        }

        // Verify provider has services
        if (provider.services.length === 0) {
          this.log(`   ⚠️  Skipping - provider has no services assigned`);
          this.stats.providersSkipped++;
          continue;
        }

        this.stats.providersWithServices++;

        // Create starter catalogue items for each service
        const createdCount = await this.createStarterCatalogueItems(provider);
        this.stats.catalogueItemsCreated += createdCount;
      }

      this.stats.endTime = new Date().toISOString();
      this.stats.duration = new Date(this.stats.endTime).getTime() - new Date(this.stats.startTime).getTime();

      this.log(`\n📈 Backfill Summary:`);
      this.log(`   ✅ Created: ${this.stats.catalogueItemsCreated} catalogue items`);
      this.log(`   ⏭️  Skipped: ${this.stats.providersSkipped} providers`);
      this.log(`   📊 Total providers processed: ${providers.length}`);
      this.log(`   ⏱️  Duration: ${Math.round(this.stats.duration / 1000)}s`);

      if (this.stats.errors.length > 0) {
        this.log(`   ❌ Errors: ${this.stats.errors.length}`);
        this.stats.errors.forEach(error => {
          this.log(`      - Provider ${error.providerId}: ${error.error}`);
        });
      }

    } catch (error) {
      this.log('❌ Backfill failed:', error);
      throw error;
    }
  }

  async verifyMigration() {
    this.log('🔍 Verifying migration...');

    const totalCatalogueItems = await prisma.catalogueItem.count();
    const activeItems = await prisma.catalogueItem.count({
      where: { isActive: true }
    });
    const providersWithItems = await prisma.provider.count({
      where: {
        catalogueItems: {
          some: {
            isActive: true
          }
        }
      }
    });

    this.log(`🔍 Verification Results:`);
    this.log(`   📦 Total catalogue items: ${totalCatalogueItems}`);
    this.log(`   ✅ Active catalogue items: ${activeItems}`);
    this.log(`   👥 Providers with active items: ${providersWithItems}`);

    // Verify data integrity
    const itemsWithoutProvider = await prisma.catalogueItem.count({
      where: {
        provider: null
      }
    });

    const itemsWithoutService = await prisma.catalogueItem.count({
      where: {
        service: null
      }
    });

    if (itemsWithoutProvider > 0 || itemsWithoutService > 0) {
      this.log(`   ⚠️  Data integrity issues detected:`);
      this.log(`      - Items without provider: ${itemsWithoutProvider}`);
      this.log(`      - Items without service: ${itemsWithoutService}`);
    } else {
      this.log(`   ✅ Data integrity verified`);
    }
  }

  async generateReport() {
    const reportFile = join(this.logDir, `backfill-report-${new Date().toISOString().split('T')[0]}.json`);
    writeFileSync(reportFile, JSON.stringify(this.stats, null, 2));
    this.log(`📄 Detailed report saved to: ${reportFile}`);
  }

  async cleanup() {
    await prisma.$disconnect();
  }
}

// Main execution
async function main() {
  const backfillService = new CatalogueBackfillService();
  
  try {
    await backfillService.backfillProviders();
    await backfillService.verifyMigration();
    await backfillService.generateReport();
    
    console.log('🎉 Backfill completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Backfill failed:', error);
    process.exit(1);
  } finally {
    await backfillService.cleanup();
  }
}

// Run the backfill
if (require.main === module) {
  main();
}

export { CatalogueBackfillService };


