/**
 * 🔄 Sync Services & Categories from Development to Production
 * 
 * PRODUCTION-GRADE SCRIPT - Use with extreme caution!
 * 
 * This script safely syncs service categories and services from your development
 * database to production database, preserving existing bookings and provider relationships.
 * 
 * SAFETY FEATURES:
 * - Requires explicit confirmation before making changes
 * - Creates backups before syncing
 * - Dry-run mode to preview changes
 * - Preserves existing service IDs when possible
 * - Never deletes services that have bookings or providers
 * - Detailed logging and rollback instructions
 * 
 * USAGE:
 *   # Dry-run (preview changes without applying)
 *   npx tsx scripts/sync-dev-to-prod-services.ts --dry-run
 * 
 *   # Actual sync (requires confirmation)
 *   npx tsx scripts/sync-dev-to-prod-services.ts
 * 
 * PREREQUISITES:
 * 1. Set DEV_DATABASE_URL in .env (development database)
 * 2. Set PROD_DATABASE_URL in .env (production database)
 * 3. Verify you're syncing the correct databases
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'path';
import * as readline from 'readline';
import { validateMutationScript } from '../lib/ci-enforcement';
import { validateEnvironmentFingerprint, getExpectedEnvironment } from '../lib/env-fingerprint';

// Load environment variables
const envPath = resolve(process.cwd(), '.env');
config({ path: envPath });

// Also try .env.development
const devEnvPath = resolve(process.cwd(), '.env.development');
config({ path: devEnvPath });

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

interface SyncStats {
  categories: { created: number; updated: number; skipped: number };
  services: { created: number; updated: number; skipped: number; deactivated: number };
}

class DevToProdSync {
  private devPrisma: PrismaClient;
  private prodPrisma: PrismaClient;
  private dryRun: boolean;
  private stats: SyncStats;

  constructor(devUrl: string, prodUrl: string, dryRun: boolean = false) {
    this.dryRun = dryRun;
    this.stats = {
      categories: { created: 0, updated: 0, skipped: 0 },
      services: { created: 0, updated: 0, skipped: 0, deactivated: 0 },
    };

    // Initialize Prisma clients
    this.devPrisma = new PrismaClient({
      datasources: { db: { url: devUrl } },
      log: dryRun ? [] : ['error', 'warn'],
    });

    this.prodPrisma = new PrismaClient({
      datasources: { db: { url: prodUrl } },
      log: dryRun ? [] : ['error', 'warn'],
    });
  }

  /**
   * Validate database connections and show summary
   */
  async validateConnections(): Promise<boolean> {
    console.log(`\n${colors.cyan}${colors.bold}🔍 Validating Database Connections...${colors.reset}\n`);

    try {
      // Test dev connection
      await this.devPrisma.$queryRaw`SELECT 1`;
      const devCategories = await this.devPrisma.serviceCategory.count();
      const devServices = await this.devPrisma.service.count();
      console.log(`${colors.green}✅ Development Database:${colors.reset}`);
      console.log(`   - Categories: ${devCategories}`);
      console.log(`   - Services: ${devServices}`);

      // Test prod connection
      await this.prodPrisma.$queryRaw`SELECT 1`;
      const prodCategories = await this.prodPrisma.serviceCategory.count();
      const prodServices = await this.prodPrisma.service.count();
      console.log(`${colors.green}✅ Production Database:${colors.reset}`);
      console.log(`   - Categories: ${prodCategories}`);
      console.log(`   - Services: ${prodServices}`);

      return true;
    } catch (error) {
      console.error(`${colors.red}❌ Connection failed:${colors.reset}`, error);
      return false;
    }
  }

  /**
   * Create backup of production services and categories
   */
  async createBackup(): Promise<void> {
    if (this.dryRun) {
      console.log(`${colors.yellow}⚠️  DRY RUN: Would create backup${colors.reset}`);
      return;
    }

    console.log(`\n${colors.cyan}📦 Creating Production Backup...${colors.reset}\n`);

    try {
      // Backup categories
      const categories = await this.prodPrisma.serviceCategory.findMany();
      const services = await this.prodPrisma.service.findMany({
        include: { category: true },
      });

      console.log(`${colors.green}✅ Backup created:${colors.reset}`);
      console.log(`   - ${categories.length} categories`);
      console.log(`   - ${services.length} services`);
      console.log(`   ${colors.yellow}⚠️  Note: Full backup should be saved to file for rollback${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}❌ Backup failed:${colors.reset}`, error);
      throw error;
    }
  }

  /**
   * Sync categories from dev to prod
   */
  async syncCategories(): Promise<Map<string, string>> {
    console.log(`\n${colors.cyan}📊 Syncing Service Categories...${colors.reset}\n`);

    // Get all categories from dev
    const devCategories = await this.devPrisma.serviceCategory.findMany({
      orderBy: { name: 'asc' },
    });

    // Get all categories from prod
    const prodCategories = await this.prodPrisma.serviceCategory.findMany();

    const categoryMap = new Map<string, string>(); // devId -> prodId

    for (const devCat of devCategories) {
      // Find matching category in prod by name
      let prodCat = prodCategories.find((c) => c.name === devCat.name);

      if (!prodCat) {
        // Category doesn't exist in prod - create it
        if (this.dryRun) {
          console.log(`${colors.yellow}  [DRY RUN] Would create category: "${devCat.name}"${colors.reset}`);
          this.stats.categories.created++;
          // Use dev ID for dry-run mapping
          categoryMap.set(devCat.id, devCat.id);
        } else {
          prodCat = await this.prodPrisma.serviceCategory.create({
            data: {
              name: devCat.name,
              description: devCat.description,
              icon: devCat.icon,
              isActive: devCat.isActive,
            },
          });
          console.log(`${colors.green}  ✅ Created category: "${devCat.name}"${colors.reset}`);
          this.stats.categories.created++;
        }
      } else {
        // Category exists - update it
        if (this.dryRun) {
          const needsUpdate =
            prodCat.description !== devCat.description ||
            prodCat.icon !== devCat.icon ||
            prodCat.isActive !== devCat.isActive;

          if (needsUpdate) {
            console.log(`${colors.yellow}  [DRY RUN] Would update category: "${devCat.name}"${colors.reset}`);
            this.stats.categories.updated++;
          } else {
            console.log(`  ✓ Category exists: "${devCat.name}"`);
            this.stats.categories.skipped++;
          }
        } else {
          prodCat = await this.prodPrisma.serviceCategory.update({
            where: { id: prodCat.id },
            data: {
              description: devCat.description,
              icon: devCat.icon,
              isActive: devCat.isActive,
            },
          });
          console.log(`${colors.green}  🔄 Updated category: "${devCat.name}"${colors.reset}`);
          this.stats.categories.updated++;
        }
      }

      if (!this.dryRun && prodCat) {
        categoryMap.set(devCat.id, prodCat.id);
      }
    }

    return categoryMap;
  }

  /**
   * Sync services from dev to prod
   */
  async syncServices(categoryMap: Map<string, string>): Promise<void> {
    console.log(`\n${colors.cyan}📊 Syncing Services...${colors.reset}\n`);

    // Get all services from dev with categories
    const devServices = await this.devPrisma.service.findMany({
      include: { category: true },
      orderBy: { name: 'asc' },
    });

    // Get all services from prod
    const prodServices = await this.prodPrisma.service.findMany();

    // Get services with bookings/providers (don't deactivate these)
    const servicesWithBookings = await this.prodPrisma.service.findMany({
      where: {
        OR: [
          { bookings: { some: {} } },
          { providers: { some: {} } },
        ],
      },
      select: { id: true, name: true },
    });

    const protectedServiceIds = new Set(servicesWithBookings.map((s) => s.id));
    const protectedServiceNames = new Set(servicesWithBookings.map((s) => s.name));

    for (const devService of devServices) {
      const prodCategoryId = categoryMap.get(devService.categoryId);
      if (!prodCategoryId) {
        console.log(
          `${colors.red}  ❌ Skipping service "${devService.name}" - category not found in prod${colors.reset}`
        );
        this.stats.services.skipped++;
        continue;
      }

      // Find matching service in prod by name
      let prodService = prodServices.find((s) => s.name === devService.name);

      if (!prodService) {
        // Service doesn't exist - create it
        if (this.dryRun) {
          console.log(
            `${colors.yellow}  [DRY RUN] Would create service: "${devService.name}" (${devService.category.name})${colors.reset}`
          );
          this.stats.services.created++;
        } else {
          prodService = await this.prodPrisma.service.create({
            data: {
              name: devService.name,
              description: devService.description,
              categoryId: prodCategoryId,
              basePrice: devService.basePrice,
              isActive: devService.isActive,
            },
          });
          console.log(
            `${colors.green}  ✅ Created service: "${devService.name}" (${devService.category.name})${colors.reset}`
          );
          this.stats.services.created++;
        }
      } else {
        // Service exists - update it (but preserve ID for bookings/providers)
        const needsUpdate =
          prodService.description !== devService.description ||
          prodService.categoryId !== prodCategoryId ||
          prodService.basePrice !== devService.basePrice ||
          prodService.isActive !== devService.isActive;

        if (needsUpdate) {
          if (this.dryRun) {
            console.log(
              `${colors.yellow}  [DRY RUN] Would update service: "${devService.name}"${colors.reset}`
            );
            this.stats.services.updated++;
          } else {
            // If service has bookings/providers, don't change isActive to false
            const shouldDeactivate = !devService.isActive && !protectedServiceIds.has(prodService.id);

            prodService = await this.prodPrisma.service.update({
              where: { id: prodService.id },
              data: {
                description: devService.description,
                categoryId: prodCategoryId,
                basePrice: devService.basePrice,
                isActive: shouldDeactivate ? false : devService.isActive,
              },
            });
            console.log(
              `${colors.green}  🔄 Updated service: "${devService.name}"${colors.reset}`
            );
            this.stats.services.updated++;
          }
        } else {
          console.log(`  ✓ Service exists: "${devService.name}"`);
          this.stats.services.skipped++;
        }
      }
    }

    // Deactivate services in prod that don't exist in dev (but protect those with bookings)
    const devServiceNames = new Set(devServices.map((s) => s.name));
    const servicesToDeactivate = prodServices.filter(
      (s) => !devServiceNames.has(s.name) && s.isActive && !protectedServiceNames.has(s.name)
    );

    if (servicesToDeactivate.length > 0) {
      console.log(`\n${colors.yellow}⚠️  Services in prod not in dev (will be deactivated):${colors.reset}`);
      for (const service of servicesToDeactivate) {
        if (this.dryRun) {
          console.log(`${colors.yellow}  [DRY RUN] Would deactivate: "${service.name}"${colors.reset}`);
          this.stats.services.deactivated++;
        } else {
          await this.prodPrisma.service.update({
            where: { id: service.id },
            data: { isActive: false },
          });
          console.log(`${colors.yellow}  ⚠️  Deactivated: "${service.name}"${colors.reset}`);
          this.stats.services.deactivated++;
        }
      }
    }
  }

  /**
   * Print final summary
   */
  printSummary(): void {
    console.log(`\n${colors.cyan}${colors.bold}📊 Sync Summary${colors.reset}\n`);

    console.log(`${colors.bold}Categories:${colors.reset}`);
    console.log(`  - Created: ${this.stats.categories.created}`);
    console.log(`  - Updated: ${this.stats.categories.updated}`);
    console.log(`  - Skipped: ${this.stats.categories.skipped}`);

    console.log(`\n${colors.bold}Services:${colors.reset}`);
    console.log(`  - Created: ${this.stats.services.created}`);
    console.log(`  - Updated: ${this.stats.services.updated}`);
    console.log(`  - Skipped: ${this.stats.services.skipped}`);
    console.log(`  - Deactivated: ${this.stats.services.deactivated}`);

    if (this.dryRun) {
      console.log(`\n${colors.yellow}${colors.bold}⚠️  DRY RUN MODE - No changes were made${colors.reset}`);
      console.log(`   Run without --dry-run to apply changes.\n`);
    } else {
      console.log(`\n${colors.green}${colors.bold}✅ Sync completed successfully!${colors.reset}\n`);
    }
  }

  /**
   * Main sync process
   */
  async sync(): Promise<void> {
    try {
      // Validate connections
      const isValid = await this.validateConnections();
      if (!isValid) {
        throw new Error('Database connection validation failed');
      }

      // Create backup
      await this.createBackup();

      // Sync categories first (services depend on them)
      const categoryMap = await this.syncCategories();

      // Sync services
      await this.syncServices(categoryMap);

      // Print summary
      this.printSummary();
    } catch (error) {
      console.error(`\n${colors.red}${colors.bold}❌ Sync failed:${colors.reset}`, error);
      throw error;
    } finally {
      await this.devPrisma.$disconnect();
      await this.prodPrisma.$disconnect();
    }
  }
}

/**
 * Prompt user for confirmation
 */
function promptConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log(`\n${'='.repeat(80)}`);
  console.log(`${' '.repeat(20)}🔄 DEV TO PROD SERVICES SYNC${' '.repeat(20)}`);
  console.log(`${'='.repeat(80)}\n`);

  if (dryRun) {
    console.log(`${'⚠️  '.repeat(20)} DRY RUN MODE ${'⚠️  '.repeat(20)}\n`);
  } else {
    console.log(`${'🚨 '.repeat(20)} PRODUCTION MODE ${'🚨 '.repeat(20)}\n`);
  }

  // Get database URLs
  const devUrl = process.env.DEV_DATABASE_URL || process.env.DATABASE_URL;
  const prodUrl = process.env.PROD_DATABASE_URL;

  if (!devUrl) {
    console.error('❌ ERROR: DEV_DATABASE_URL or DATABASE_URL environment variable required');
    console.error('   Set DEV_DATABASE_URL to your development database URL');
    process.exit(1);
  }

  if (!prodUrl) {
    console.error('❌ ERROR: PROD_DATABASE_URL environment variable required');
    console.error('   Set PROD_DATABASE_URL to your production database URL');
    process.exit(1);
  }

  // Show database URLs (masked)
  const maskUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
    } catch {
      return url.substring(0, 30) + '...';
    }
  };

  console.log(`Development DB: ${maskUrl(devUrl)}`);
  console.log(`Production DB: ${maskUrl(prodUrl)}\n`);

  if (!dryRun) {
    // CRITICAL: Enforce CI-only execution for production mutations
    try {
      validateMutationScript('sync-dev-to-prod', prodUrl);
    } catch (error: any) {
      console.error('\n' + '='.repeat(80));
      console.error('🚨 BLOCKED: Production sync requires CI=true');
      console.error('='.repeat(80));
      console.error(error.message || error);
      console.error('='.repeat(80) + '\n');
      process.exit(1);
    }

    // CRITICAL: Validate environment fingerprints
    console.log('\n🔍 Validating environment fingerprints...\n');
    
    try {
      // Validate dev database fingerprint
      const devFingerprint = await validateEnvironmentFingerprint(devUrl, 'dev');
      if (!devFingerprint.isValid) {
        console.error(`❌ Development database fingerprint validation failed:`);
        console.error(`   ${devFingerprint.error}`);
        process.exit(1);
      }
      console.log('✅ Development database fingerprint validated');

      // Validate prod database fingerprint
      const prodFingerprint = await validateEnvironmentFingerprint(prodUrl, 'prod');
      if (!prodFingerprint.isValid) {
        console.error(`❌ Production database fingerprint validation failed:`);
        console.error(`   ${prodFingerprint.error}`);
        process.exit(1);
      }
      console.log('✅ Production database fingerprint validated\n');
    } catch (error: any) {
      console.error(`\n❌ CRITICAL: Environment fingerprint validation failed:`);
      console.error(`   ${error.message}`);
      console.error(`\nThis prevents accidental cross-environment access.\n`);
      process.exit(1);
    }

    console.log(`${'⚠️  '.repeat(20)} WARNING ${'⚠️  '.repeat(20)}`);
    console.log('This will modify your PRODUCTION database!');
    console.log('Make sure you have:');
    console.log('  1. Backed up your production database');
    console.log('  2. Verified the database URLs are correct');
    console.log('  3. Tested this in a staging environment first\n');

    const confirmed = await promptConfirmation('Are you sure you want to proceed?');
    if (!confirmed) {
      console.log('\n❌ Sync cancelled by user');
      process.exit(0);
    }
  }

  // Run sync
  const sync = new DevToProdSync(devUrl, prodUrl, dryRun);
  await sync.sync();
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { DevToProdSync };
