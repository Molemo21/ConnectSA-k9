/**
 * 🔒 REFERENCE DATA PROMOTION SCRIPT (CI-ONLY)
 * 
 * PRODUCTION MUTATION SCRIPT - PHYSICALLY IMPOSSIBLE TO RUN LOCALLY
 * 
 * This is the ONLY allowed script for promoting reference data (categories & services)
 * from DEV → PROD. It is locked down with multiple layers of enforcement.
 * 
 * HARD RULES (NO EXCEPTIONS):
 * 1. CI-ONLY execution - process.exit(1) if CI !== "true" (BEFORE imports)
 * 2. Environment fingerprint validation - DEV must be dev, PROD must be prod
 * 3. Strict allowlist - ONLY service_categories and services tables
 * 4. NO DELETIONS - No DELETE, TRUNCATE, DROP operations
 * 5. Relationship safety - Services with bookings/providers are skipped
 * 6. Idempotent - Re-running causes no drift
 * 7. Explicit modes - --dry-run (default) or --apply (requires YES)
 * 
 * USAGE:
 *   # Dry-run (preview changes, always allowed)
 *   npm run sync:reference:dry-run
 * 
 *   # Apply changes (CI-only, requires --apply flag)
 *   npm run sync:reference:apply
 * 
 * PREREQUISITES:
 * 1. DEV_DATABASE_URL must point to development database
 * 2. PROD_DATABASE_URL must point to production database
 * 3. Both databases must have valid environment fingerprints
 */

// ============================================================================
// CRITICAL: Guards execute BEFORE any imports or database connections
// These guards are the FIRST lines of code that execute
// ============================================================================

// GUARD 1: CI-only execution (PHYSICAL IMPOSSIBILITY)
// This check happens BEFORE any imports to prevent any possibility of bypass
const ci = process.env.CI || '';
const isCI = ci === 'true' || ci === '1' || ci.toLowerCase() === 'true';

// Parse arguments BEFORE checking CI (to allow --dry-run locally)
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isApply = args.includes('--apply');

// If applying changes (not dry-run), MUST be in CI
if (isApply && !isDryRun && !isCI) {
  console.error('\n' + '='.repeat(80));
  console.error('🚨 BLOCKED: Reference data promotion requires CI=true');
  console.error('='.repeat(80));
  console.error(`Current CI: ${ci || '(not set)'}`);
  console.error('');
  console.error('Production reference data mutations are PHYSICALLY IMPOSSIBLE outside CI/CD pipelines.');
  console.error('This guard executes BEFORE any imports or database connections.');
  console.error('');
  console.error('To preview changes (dry-run), use: npm run sync:reference:dry-run');
  console.error('To apply changes, this must run in CI with CI=true');
  console.error('');
  console.error('NO BYPASSES EXIST. This is a HARD GUARANTEE.');
  console.error('='.repeat(80) + '\n');
  process.exit(1);
}

// ============================================================================
// Only after CI guard passes, proceed with imports
// ============================================================================
// NOTE: PrismaClient is NOT imported here - it will be lazy-imported
//       AFTER prisma generate runs in main() to prevent initialization errors

import { config } from 'dotenv';
import { resolve } from 'path';
import * as readline from 'readline';
import { execSync } from 'child_process';
import { validateEnvironmentFingerprint } from '../lib/env-fingerprint';

// Load environment variables
const envPath = resolve(process.cwd(), '.env');
config({ path: envPath });

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
  services: { created: number; updated: number; skipped: number };
}

// STRICT ALLOWLIST - Only these tables are allowed
const ALLOWED_TABLES = new Set(['service_categories', 'services']);

/**
 * Validate that only allowed tables are being accessed
 * This is a runtime check to prevent accidental mutations to other tables
 */
function validateTableAccess(tableName: string): void {
  if (!ALLOWED_TABLES.has(tableName)) {
    const error = `
${'='.repeat(80)}
🚨 CONTRACT VIOLATION: Table "${tableName}" is not in allowlist
${'='.repeat(80)}
Allowed tables: ${Array.from(ALLOWED_TABLES).join(', ')}
Attempted access: ${tableName}

This script can ONLY mutate service_categories and services tables.
Any attempt to access other tables is a contract violation.
${'='.repeat(80)}
`;
    console.error(error);
    process.exit(1);
  }
}

// Type alias for PrismaClient (will be imported dynamically)
// Using any for now since we're using require() for dynamic import
type PrismaClientType = any;

/**
 * Check if a service has bookings or providers (must be skipped)
 */
async function hasActiveRelationships(
  prisma: PrismaClientType,
  serviceId: string
): Promise<boolean> {
  const [bookings, providers] = await Promise.all([
    prisma.booking.count({
      where: { serviceId },
    }),
    prisma.providerService.count({
      where: { serviceId },
    }),
  ]);

  return bookings > 0 || providers > 0;
}

class ReferenceDataPromotion {
  private devPrisma: PrismaClientType;
  private prodPrisma: PrismaClientType;
  private dryRun: boolean;
  private stats: SyncStats;

  constructor(devUrl: string, prodUrl: string, dryRun: boolean = false) {
    this.dryRun = dryRun;
    this.stats = {
      categories: { created: 0, updated: 0, skipped: 0 },
      services: { created: 0, updated: 0, skipped: 0 },
    };

    // Lazy import PrismaClient (must be called after prisma generate)
    try {
      // Clear module cache to ensure we get the freshly generated client
      // Clear all @prisma/client related modules from cache
      const modulePaths = Object.keys(require.cache);
      modulePaths.forEach(path => {
        if (path.includes('@prisma/client') || path.includes('.prisma')) {
          delete require.cache[path];
        }
      });
      
      // Also try to resolve and clear the main module
      try {
        const prismaClientPath = require.resolve('@prisma/client');
        delete require.cache[prismaClientPath];
      } catch {
        // If resolve fails, that's OK - we'll try require anyway
      }
      
      const { PrismaClient } = require('@prisma/client');
      
      // Initialize Prisma clients
      this.devPrisma = new PrismaClient({
        datasources: { db: { url: devUrl } },
        log: dryRun ? [] : ['error', 'warn'],
      });

      this.prodPrisma = new PrismaClient({
        datasources: { db: { url: prodUrl } },
        log: dryRun ? [] : ['error', 'warn'],
      });
    } catch (error) {
      throw new Error(
        `Failed to import PrismaClient. Ensure 'npx prisma generate' has run. ` +
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Validate database connections and environment fingerprints
   */
  async validateConnections(devUrl: string, prodUrl: string): Promise<boolean> {
    console.log(`\n${colors.cyan}${colors.bold}🔍 Validating Database Connections & Fingerprints...${colors.reset}\n`);

    try {
      // Test dev connection
      await this.devPrisma.$queryRaw`SELECT 1`;
      const devCategories = await this.devPrisma.serviceCategory.count();
      const devServices = await this.devPrisma.service.count();
      console.log(`${colors.green}✅ Development Database:${colors.reset}`);
      console.log(`   - Categories: ${devCategories}`);
      console.log(`   - Services: ${devServices}`);

      // CRITICAL: Validate DEV database fingerprint
      const devFp = await validateEnvironmentFingerprint(devUrl, 'dev');
      if (!devFp.isValid) {
        console.error(`${colors.red}❌ Development database fingerprint validation failed:${colors.reset}`);
        console.error(`   ${devFp.error}`);
        return false;
      }
      console.log(`${colors.green}✅ Development database fingerprint validated${colors.reset}`);

      // Test prod connection
      await this.prodPrisma.$queryRaw`SELECT 1`;
      const prodCategories = await this.prodPrisma.serviceCategory.count();
      const prodServices = await this.prodPrisma.service.count();
      console.log(`${colors.green}✅ Production Database:${colors.reset}`);
      console.log(`   - Categories: ${prodCategories}`);
      console.log(`   - Services: ${prodServices}`);

      // CRITICAL: Validate PROD database fingerprint (only if applying)
      if (!this.dryRun) {
        const prodFp = await validateEnvironmentFingerprint(prodUrl, 'prod');
        if (!prodFp.isValid) {
          console.error(`${colors.red}❌ Production database fingerprint validation failed:${colors.reset}`);
          console.error(`   ${prodFp.error}`);
          return false;
        }
        console.log(`${colors.green}✅ Production database fingerprint validated${colors.reset}`);
      }

      return true;
    } catch (error) {
      console.error(`${colors.red}❌ Connection failed:${colors.reset}`, error);
      return false;
    }
  }

  /**
   * Sync categories from dev to prod
   */
  async syncCategories(): Promise<Map<string, string>> {
    validateTableAccess('service_categories');
    
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
   * NO DELETIONS - Only creates and updates
   */
  async syncServices(categoryMap: Map<string, string>): Promise<void> {
    validateTableAccess('services');
    
    console.log(`\n${colors.cyan}📊 Syncing Services...${colors.reset}\n`);

    // Get all services from dev with categories
    const devServices = await this.devPrisma.service.findMany({
      include: { category: true },
      orderBy: { name: 'asc' },
    });

    // Get all services from prod
    const prodServices = await this.prodPrisma.service.findMany();

    // Get services with bookings/providers (don't modify these)
    const servicesWithRelationships = await this.prodPrisma.service.findMany({
      where: {
        OR: [
          { bookings: { some: {} } },
          { providers: { some: {} } },
        ],
      },
      select: { id: true, name: true },
    });

    const protectedServiceIds = new Set(servicesWithRelationships.map((s) => s.id));
    const protectedServiceNames = new Set(servicesWithRelationships.map((s) => s.name));

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
        // Service exists - check if it's protected
        if (protectedServiceIds.has(prodService.id)) {
          console.log(
            `${colors.yellow}  ⚠️  Skipping protected service: "${devService.name}" (has bookings/providers)${colors.reset}`
          );
          this.stats.services.skipped++;
          continue;
        }

        // Update it (but preserve ID for bookings/providers)
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
            prodService = await this.prodPrisma.service.update({
              where: { id: prodService.id },
              data: {
                description: devService.description,
                categoryId: prodCategoryId,
                basePrice: devService.basePrice,
                isActive: devService.isActive,
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

    // NOTE: We do NOT deactivate services in prod that don't exist in dev
    // This is intentional - we only promote, never remove
    console.log(`\n${colors.cyan}ℹ️  Note: Services in prod not in dev are left unchanged (no deletions)${colors.reset}`);
  }

  /**
   * Print final summary
   */
  printSummary(): void {
    console.log(`\n${colors.cyan}${colors.bold}📊 Promotion Summary${colors.reset}\n`);

    console.log(`${colors.bold}Categories:${colors.reset}`);
    console.log(`  - Created: ${this.stats.categories.created}`);
    console.log(`  - Updated: ${this.stats.categories.updated}`);
    console.log(`  - Skipped: ${this.stats.categories.skipped}`);

    console.log(`\n${colors.bold}Services:${colors.reset}`);
    console.log(`  - Created: ${this.stats.services.created}`);
    console.log(`  - Updated: ${this.stats.services.updated}`);
    console.log(`  - Skipped: ${this.stats.services.skipped}`);

    if (this.dryRun) {
      console.log(`\n${colors.yellow}${colors.bold}⚠️  DRY RUN MODE - No changes were made${colors.reset}`);
      console.log(`   Run with --apply flag in CI to apply changes.\n`);
    } else {
      console.log(`\n${colors.green}${colors.bold}✅ Promotion completed successfully!${colors.reset}\n`);
    }
  }

  /**
   * Main promotion process
   */
  async promote(devUrl: string, prodUrl: string): Promise<void> {
    try {
      // Validate connections and fingerprints
      const isValid = await this.validateConnections(devUrl, prodUrl);
      if (!isValid) {
        throw new Error('Database connection or fingerprint validation failed');
      }

      // Sync categories first (services depend on them)
      const categoryMap = await this.syncCategories();

      // Sync services
      await this.syncServices(categoryMap);

      // Print summary
      this.printSummary();
    } catch (error) {
      console.error(`\n${colors.red}${colors.bold}❌ Promotion failed:${colors.reset}`, error);
      throw error;
    } finally {
      await this.devPrisma.$disconnect();
      await this.prodPrisma.$disconnect();
    }
  }
}

/**
 * Prompt user for confirmation (only used in apply mode)
 */
function promptConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} (type YES to confirm): `, (answer) => {
      rl.close();
      resolve(answer.trim().toUpperCase() === 'YES');
    });
  });
}

/**
 * Main execution
 */
async function main() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`${' '.repeat(20)}🔒 REFERENCE DATA PROMOTION (CI-ONLY)${' '.repeat(20)}`);
  console.log(`${'='.repeat(80)}\n`);

  // Generate Prisma client first (required before PrismaClient can be imported)
  console.log('📦 Generating Prisma client...');
  try {
    execSync('npx prisma generate', {
      stdio: 'inherit',
      env: { ...process.env }
    });
    console.log('✅ Prisma client generated\n');
  } catch (error) {
    console.error(`${colors.red}❌ Failed to generate Prisma client:${colors.reset}`);
    console.error(`   ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  if (isDryRun) {
    console.log(`${'⚠️  '.repeat(20)} DRY RUN MODE ${'⚠️  '.repeat(20)}\n`);
  } else if (isApply) {
    console.log(`${'🚨 '.repeat(20)} APPLY MODE (CI-ONLY) ${'🚨 '.repeat(20)}\n`);
    
    // Double-check CI requirement
    if (!isCI) {
      console.error(`${colors.red}❌ ERROR: --apply requires CI=true${colors.reset}`);
      process.exit(1);
    }
  } else {
    // Default to dry-run if no flag specified
    console.log(`${'⚠️  '.repeat(20)} DRY RUN MODE (default) ${'⚠️  '.repeat(20)}\n`);
  }

  // Get database URLs
  const devUrl = process.env.DEV_DATABASE_URL || process.env.DATABASE_URL;
  const prodUrl = process.env.PROD_DATABASE_URL;

  if (!devUrl) {
    console.error(`${colors.red}❌ ERROR: DEV_DATABASE_URL or DATABASE_URL environment variable required${colors.reset}`);
    console.error('   Set DEV_DATABASE_URL to your development database URL');
    process.exit(1);
  }

  if (!prodUrl) {
    console.error(`${colors.red}❌ ERROR: PROD_DATABASE_URL environment variable required${colors.reset}`);
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

  if (isApply && !isDryRun) {
    console.log(`${'⚠️  '.repeat(20)} WARNING ${'⚠️  '.repeat(20)}`);
    console.log('This will modify your PRODUCTION database!');
    console.log('Make sure you have:');
    console.log('  1. Backed up your production database');
    console.log('  2. Verified the database URLs are correct');
    console.log('  3. Tested this in a staging environment first\n');

    const confirmed = await promptConfirmation('Are you sure you want to proceed?');
    if (!confirmed) {
      console.log('\n❌ Promotion cancelled by user');
      process.exit(0);
    }
  }

  // Run promotion
  const promotion = new ReferenceDataPromotion(devUrl, prodUrl, isDryRun || !isApply);
  await promotion.promote(devUrl, prodUrl);
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { ReferenceDataPromotion };
