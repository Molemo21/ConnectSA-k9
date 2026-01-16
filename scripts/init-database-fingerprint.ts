/**
 * Initialize Database Environment Fingerprint
 * 
 * This script initializes the database_metadata table with the correct
 * environment fingerprint. It should be run:
 * - Once per database (dev, staging, prod)
 * - During initial database setup
 * - After creating the database_metadata table
 * 
 * Usage:
 *   npx tsx scripts/init-database-fingerprint.ts <environment>
 * 
 * Example:
 *   npx tsx scripts/init-database-fingerprint.ts dev
 *   npx tsx scripts/init-database-fingerprint.ts prod
 */

import { initializeEnvironmentFingerprint, type Environment } from '../lib/env-fingerprint';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
const envPath = resolve(process.cwd(), '.env');
config({ path: envPath });

const devEnvPath = resolve(process.cwd(), '.env.development');
config({ path: devEnvPath });

async function main() {
  const args = process.argv.slice(2);
  const environment = args[0] as Environment;

  if (!environment || !['dev', 'staging', 'prod'].includes(environment)) {
    console.error('❌ ERROR: Environment argument required');
    console.error('Usage: npx tsx scripts/init-database-fingerprint.ts <dev|staging|prod>');
    console.error('');
    console.error('Example:');
    console.error('  npx tsx scripts/init-database-fingerprint.ts dev');
    process.exit(1);
  }

  // Get database URL based on environment
  let databaseUrl: string;
  
  if (environment === 'prod') {
    databaseUrl = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL || '';
  } else if (environment === 'staging') {
    databaseUrl = process.env.STAGING_DATABASE_URL || process.env.DATABASE_URL || '';
  } else {
    databaseUrl = process.env.DEV_DATABASE_URL || process.env.DATABASE_URL || '';
  }

  if (!databaseUrl) {
    console.error(`❌ ERROR: Database URL not found for environment "${environment}"`);
    console.error(`   Set ${environment.toUpperCase()}_DATABASE_URL or DATABASE_URL`);
    process.exit(1);
  }

  console.log(`\n🔐 Initializing environment fingerprint for: ${environment}`);
  console.log(`   Database: ${databaseUrl.substring(0, 50)}...\n`);

  try {
    await initializeEnvironmentFingerprint(databaseUrl, environment);
    console.log(`✅ Environment fingerprint initialized successfully`);
    console.log(`   Environment: ${environment}`);
    console.log(`   Database is now protected from misconfiguration\n`);
  } catch (error: any) {
    console.error(`❌ Failed to initialize fingerprint: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
