/**
 * Analyze Failed Migration: 20250120120000_add_payout_and_webhook_models
 * 
 * This script determines the actual state of the failed migration:
 * - Checks if migration objects exist (enum, tables, indexes, FKs)
 * - Determines if migration succeeded or failed
 * - Outputs verdict: APPLIED or ROLLED_BACK
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
const envPath = resolve(process.cwd(), '.env');
config({ path: envPath });
const envProdPath = resolve(process.cwd(), '.env.production');
config({ path: envProdPath });
const envLocalPath = resolve(process.cwd(), '.env.local');
config({ path: envLocalPath });
const envProdLocalPath = resolve(process.cwd(), '.env.production.local');
config({ path: envProdLocalPath });

const dbUrl = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ ERROR: PROD_DATABASE_URL or DATABASE_URL required');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl
    }
  }
});

interface MigrationCheck {
  object: string;
  exists: boolean;
  details?: any;
}

async function analyzeFailedMigration() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 ANALYZING FAILED MIGRATION: 20250120120000_add_payout_and_webhook_models');
  console.log('='.repeat(80) + '\n');

  const checks: MigrationCheck[] = [];

  try {
    // Check 1: PayoutStatus enum
    console.log('📋 Check 1: PayoutStatus Enum');
    try {
      const enumCheck = await prisma.$queryRaw<Array<{ typname: string }>>`
        SELECT typname FROM pg_type WHERE typname = 'PayoutStatus'
      `;
      const enumExists = enumCheck.length > 0;
      checks.push({ object: 'PayoutStatus enum', exists: enumExists });
      console.log(`   ${enumExists ? '✅ EXISTS' : '❌ MISSING'}`);
      
      if (enumExists) {
        const enumValues = await prisma.$queryRaw<Array<{ enumlabel: string }>>`
          SELECT enumlabel FROM pg_enum 
          WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PayoutStatus')
          ORDER BY enumsortorder
        `;
        console.log(`   Values: ${enumValues.map(v => v.enumlabel).join(', ')}`);
      }
    } catch (error) {
      checks.push({ object: 'PayoutStatus enum', exists: false });
      console.log('   ❌ ERROR checking enum:', error instanceof Error ? error.message : error);
    }

    // Check 2: payouts table
    console.log('\n📋 Check 2: payouts Table');
    try {
      const tableCheck = await prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'payouts'
      `;
      const tableExists = tableCheck.length > 0;
      checks.push({ object: 'payouts table', exists: tableExists });
      console.log(`   ${tableExists ? '✅ EXISTS' : '❌ MISSING'}`);
      
      if (tableExists) {
        const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
          SELECT column_name FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'payouts'
          ORDER BY ordinal_position
        `;
        console.log(`   Columns: ${columns.map(c => c.column_name).join(', ')}`);
      }
    } catch (error) {
      checks.push({ object: 'payouts table', exists: false });
      console.log('   ❌ ERROR checking table:', error instanceof Error ? error.message : error);
    }

    // Check 3: webhook_events table
    console.log('\n📋 Check 3: webhook_events Table');
    try {
      const tableCheck = await prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'webhook_events'
      `;
      const tableExists = tableCheck.length > 0;
      checks.push({ object: 'webhook_events table', exists: tableExists });
      console.log(`   ${tableExists ? '✅ EXISTS' : '❌ MISSING'}`);
      
      if (tableExists) {
        const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
          SELECT column_name FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'webhook_events'
          ORDER BY ordinal_position
        `;
        console.log(`   Columns: ${columns.map(c => c.column_name).join(', ')}`);
      }
    } catch (error) {
      checks.push({ object: 'webhook_events table', exists: false });
      console.log('   ❌ ERROR checking table:', error instanceof Error ? error.message : error);
    }

    // Check 4: Foreign keys
    console.log('\n📋 Check 4: Foreign Key Constraints');
    try {
      const fkCheck = await prisma.$queryRaw<Array<{ constraint_name: string }>>`
        SELECT constraint_name FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name IN ('payouts', 'webhook_events')
        AND constraint_name LIKE '%payout%'
      `;
      const fkCount = fkCheck.length;
      checks.push({ object: 'Foreign keys', exists: fkCount > 0, details: { count: fkCount } });
      console.log(`   ${fkCount > 0 ? `✅ EXISTS (${fkCount} found)` : '❌ MISSING'}`);
    } catch (error) {
      checks.push({ object: 'Foreign keys', exists: false });
      console.log('   ❌ ERROR checking FKs:', error instanceof Error ? error.message : error);
    }

    // Check 5: Migration record status
    console.log('\n📋 Check 5: Migration Record in _prisma_migrations');
    try {
      const migrationRecord = await prisma.$queryRaw<Array<{
        migration_name: string;
        finished_at: Date | null;
        started_at: Date;
        logs: string | null;
      }>>`
        SELECT migration_name, finished_at, started_at, logs
        FROM _prisma_migrations
        WHERE migration_name = '20250120120000_add_payout_and_webhook_models'
      `;
      
      if (migrationRecord.length > 0) {
        const record = migrationRecord[0];
        console.log(`   Status: ${record.finished_at ? '✅ FINISHED' : '❌ FAILED/INCOMPLETE'}`);
        console.log(`   Started: ${record.started_at}`);
        console.log(`   Finished: ${record.finished_at || 'NOT FINISHED'}`);
        if (record.logs) {
          console.log(`   Logs: ${record.logs.substring(0, 200)}...`);
        }
      } else {
        console.log('   ❌ Migration record not found');
      }
    } catch (error) {
      console.log('   ❌ ERROR checking migration record:', error instanceof Error ? error.message : error);
    }

    // Analysis and Verdict
    console.log('\n' + '='.repeat(80));
    console.log('📊 ANALYSIS');
    console.log('='.repeat(80) + '\n');

    const allObjectsExist = checks.every(c => c.exists || c.object === 'Foreign keys');
    const enumExists = checks.find(c => c.object === 'PayoutStatus enum')?.exists || false;
    const payoutsTableExists = checks.find(c => c.object === 'payouts table')?.exists || false;
    const webhookTableExists = checks.find(c => c.object === 'webhook_events table')?.exists || false;

    console.log('Root Cause Analysis:\n');
    console.log('The migration 20250120120000_add_payout_and_webhook_models was marked as FAILED.');
    console.log('Initial error: "type PayoutStatus already exists" - enum was created but migration failed.');
    console.log('Migration has since been made idempotent (enum creation now checks for existence).\n');

    if (enumExists && payoutsTableExists && webhookTableExists) {
      console.log('✅ VERDICT: APPLIED\n');
      console.log('All migration objects exist:');
      console.log('  ✅ PayoutStatus enum exists');
      console.log('  ✅ payouts table exists');
      console.log('  ✅ webhook_events table exists');
      console.log('\nThe migration objects were created, but Prisma marked it as failed.');
      console.log('This likely occurred when the enum creation failed (before idempotency fix).');
      console.log('Since all objects exist, the migration effectively succeeded.\n');
      console.log('Required Command:');
      console.log('  npx prisma migrate resolve --applied 20250120120000_add_payout_and_webhook_models\n');
    } else if (enumExists && (!payoutsTableExists || !webhookTableExists)) {
      console.log('⚠️  VERDICT: PARTIALLY APPLIED\n');
      console.log('Migration objects are partially created:');
      console.log(`  ✅ PayoutStatus enum exists`);
      console.log(`  ${payoutsTableExists ? '✅' : '❌'} payouts table ${payoutsTableExists ? 'exists' : 'MISSING'}`);
      console.log(`  ${webhookTableExists ? '✅' : '❌'} webhook_events table ${webhookTableExists ? 'exists' : 'MISSING'}\n`);
      console.log('The migration created the enum but failed before creating tables.');
      console.log('Since the migration is now idempotent, we can mark it as applied and let it re-run.');
      console.log('The enum will be skipped (idempotent), and tables will be created.\n');
      console.log('Required Command:');
      console.log('  npx prisma migrate resolve --applied 20250120120000_add_payout_and_webhook_models\n');
    } else {
      console.log('❌ VERDICT: ROLLED_BACK\n');
      console.log('Migration objects do not exist:');
      console.log(`  ${enumExists ? '✅' : '❌'} PayoutStatus enum ${enumExists ? 'exists' : 'MISSING'}`);
      console.log(`  ${payoutsTableExists ? '✅' : '❌'} payouts table ${payoutsTableExists ? 'exists' : 'MISSING'}`);
      console.log(`  ${webhookTableExists ? '✅' : '❌'} webhook_events table ${webhookTableExists ? 'exists' : 'MISSING'}\n`);
      console.log('The migration failed before creating objects.');
      console.log('Since the migration is now idempotent, we can mark it as rolled back.');
      console.log('This will allow Prisma to re-run the migration, which will now succeed.\n');
      console.log('Required Command:');
      console.log('  npx prisma migrate resolve --rolled-back 20250120120000_add_payout_and_webhook_models\n');
    }

    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeFailedMigration()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  });
