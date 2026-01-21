#!/usr/bin/env node

/**
 * Resolve Applied Migrations (CI-ONLY)
 * 
 * This script detects failed migrations and checks if their objects already exist.
 * If all objects exist, marks migration as APPLIED.
 * If partial, fails hard (requires manual intervention).
 * 
 * Safety Guards:
 * - Requires CI=true (blocks local runs - PERMANENT)
 * - Requires NODE_ENV=production
 * - Uses Prisma Client to query database state
 * 
 * Usage:
 *   npm run resolve:applied:migrations
 * 
 * Exit Codes:
 *   0 = All failed migrations resolved or none found
 *   1 = Partial application detected (manual intervention required)
 */

// ============================================================================
// CRITICAL: Guards execute BEFORE any imports or database connections
// ============================================================================

// GUARD 1: CI-only execution
const ci = process.env.CI || '';
const isCI = ci === 'true' || ci === '1' || ci.toLowerCase() === 'true';

if (!isCI) {
  console.error('\n' + '='.repeat(80));
  console.error('🚨 BLOCKED: Migration resolution requires CI=true');
  console.error('='.repeat(80));
  console.error(`Current CI: ${ci || '(not set)'}`);
  console.error('');
  console.error('Migration resolution is PHYSICALLY IMPOSSIBLE outside CI/CD pipelines.');
  console.error('='.repeat(80) + '\n');
  process.exit(1);
}

// GUARD 2: Production environment required
const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
if (nodeEnv !== 'production' && nodeEnv !== 'prod') {
  console.error('\n' + '='.repeat(80));
  console.error('🚨 BLOCKED: Migration resolution requires NODE_ENV=production');
  console.error('='.repeat(80));
  console.error(`Current NODE_ENV: ${nodeEnv || '(not set)'}`);
  console.error('='.repeat(80) + '\n');
  process.exit(1);
}

// ============================================================================
// Only after ALL guards pass, proceed with imports
// ============================================================================

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// ============================================================================
// SQL PARSING - Extract objects from migration SQL
// ============================================================================

function parseMigrationSQL(sqlContent) {
  const objects = {
    enums: [],
    tables: [],
    indexes: [],
    foreignKeys: []
  };
  
  // Parse CREATE TYPE (enum) - handles quoted and unquoted names
  // Pattern: CREATE TYPE "EnumName" AS ENUM or CREATE TYPE EnumName AS ENUM
  const enumRegex = /CREATE\s+TYPE\s+"?(\w+)"?\s+AS\s+ENUM/gi;
  let enumMatch;
  while ((enumMatch = enumRegex.exec(sqlContent)) !== null) {
    objects.enums.push(enumMatch[1]);
  }
  
  // Parse CREATE TABLE - handles IF NOT EXISTS, quoted and unquoted names
  // Pattern: CREATE TABLE "TableName" or CREATE TABLE TableName
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"?(\w+)"?/gi;
  let tableMatch;
  while ((tableMatch = tableRegex.exec(sqlContent)) !== null) {
    objects.tables.push(tableMatch[1]);
  }
  
  // Parse CREATE INDEX - handles UNIQUE, IF NOT EXISTS, quoted and unquoted names
  // Pattern: CREATE [UNIQUE] INDEX "IndexName" or CREATE [UNIQUE] INDEX IndexName
  const indexRegex = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?"?(\w+)"?/gi;
  let indexMatch;
  while ((indexMatch = indexRegex.exec(sqlContent)) !== null) {
    objects.indexes.push(indexMatch[1]);
  }
  
  // Parse ALTER TABLE ADD CONSTRAINT (foreign keys)
  // Pattern: ADD CONSTRAINT "ConstraintName" FOREIGN KEY
  const fkRegex = /ADD\s+CONSTRAINT\s+"?(\w+)"?\s+FOREIGN\s+KEY/gi;
  let fkMatch;
  while ((fkMatch = fkRegex.exec(sqlContent)) !== null) {
    objects.foreignKeys.push(fkMatch[1]);
  }
  
  return objects;
}

// ============================================================================
// DATABASE STATE CHECKING
// ============================================================================

async function checkEnumExists(prisma, enumName) {
  try {
    const result = await prisma.$queryRawUnsafe(
      `SELECT typname FROM pg_type WHERE typname = $1`,
      enumName
    );
    return Array.isArray(result) && result.length > 0;
  } catch {
    return false;
  }
}

async function checkTableExists(prisma, tableName) {
  try {
    const result = await prisma.$queryRawUnsafe(
      `SELECT tablename FROM pg_tables 
       WHERE schemaname = 'public' AND tablename = $1`,
      tableName
    );
    return Array.isArray(result) && result.length > 0;
  } catch {
    return false;
  }
}

async function checkIndexExists(prisma, indexName) {
  try {
    const result = await prisma.$queryRawUnsafe(
      `SELECT indexname FROM pg_indexes 
       WHERE schemaname = 'public' AND indexname = $1`,
      indexName
    );
    return Array.isArray(result) && result.length > 0;
  } catch {
    return false;
  }
}

async function checkForeignKeyExists(prisma, constraintName) {
  try {
    const result = await prisma.$queryRawUnsafe(
      `SELECT conname FROM pg_constraint 
       WHERE conname = $1`,
      constraintName
    );
    return Array.isArray(result) && result.length > 0;
  } catch {
    return false;
  }
}

async function checkMigrationObjects(prisma, migrationName, objects) {
  const results = {
    enums: {},
    tables: {},
    indexes: {},
    foreignKeys: {}
  };
  
  // Check enums
  for (const enumName of objects.enums) {
    results.enums[enumName] = await checkEnumExists(prisma, enumName);
  }
  
  // Check tables
  for (const tableName of objects.tables) {
    results.tables[tableName] = await checkTableExists(prisma, tableName);
  }
  
  // Check indexes
  for (const indexName of objects.indexes) {
    results.indexes[indexName] = await checkIndexExists(prisma, indexName);
  }
  
  // Check foreign keys
  for (const fkName of objects.foreignKeys) {
    results.foreignKeys[fkName] = await checkForeignKeyExists(prisma, fkName);
  }
  
  return results;
}

// ============================================================================
// MIGRATION RESOLUTION
// ============================================================================

async function resolveFailedMigrations() {
  console.log('\n' + '='.repeat(80));
  console.log('🔧 RESOLVE APPLIED MIGRATIONS (CI-ONLY)');
  console.log('='.repeat(80));
  console.log('\n⚠️  This script checks if failed migrations are actually applied.');
  console.log('   If all objects exist, marks migration as APPLIED.');
  console.log('   If partial, fails hard (manual intervention required).\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Step 1: Find failed migrations
    console.log('📋 Step 1: Finding failed migrations...');
    const failedMigrations = await prisma.$queryRaw`
      SELECT migration_name, started_at
      FROM _prisma_migrations
      WHERE finished_at IS NULL
      ORDER BY started_at DESC
    `;
    
    if (!failedMigrations || failedMigrations.length === 0) {
      console.log('✅ No failed migrations found');
      return;
    }
    
    console.log(`⚠️  Found ${failedMigrations.length} failed migration(s):`);
    for (const migration of failedMigrations) {
      const name = migration.migration_name || migration.migrationName;
      const started = migration.started_at || migration.startedAt;
      console.log(`   - ${name} (started: ${started})`);
    }
    
    // Step 2: Check each failed migration
    console.log('\n📋 Step 2: Checking migration objects...');
    const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations');
    
    for (const migration of failedMigrations) {
      const migrationName = migration.migration_name || migration.migrationName;
      console.log(`\n🔍 Analyzing migration: ${migrationName}`);
      
      // Find migration SQL file
      const migrationPath = path.join(migrationsDir, migrationName, 'migration.sql');
      
      if (!fs.existsSync(migrationPath)) {
        console.warn(`   ⚠️  Migration SQL file not found: ${migrationPath}`);
        console.warn('   ℹ️  This migration may have been applied manually or deleted.');
        console.warn('   ℹ️  Marking as rolled-back to allow re-run...');
        
        // Mark as rolled-back if file doesn't exist
        const { execSync } = require('child_process');
        try {
          execSync(`npx prisma migrate resolve --rolled-back ${migrationName}`, {
            stdio: 'inherit',
            env: { ...process.env }
          });
          console.log(`   ✅ Migration ${migrationName} marked as rolled-back`);
        } catch (error) {
          console.error(`   ❌ Failed to resolve migration: ${error.message}`);
          throw error;
        }
        continue;
      }
      
      // Parse migration SQL
      const sqlContent = fs.readFileSync(migrationPath, 'utf8');
      const objects = parseMigrationSQL(sqlContent);
      
      console.log(`   Objects to check:`);
      console.log(`   - Enums: ${objects.enums.length}`);
      console.log(`   - Tables: ${objects.tables.length}`);
      console.log(`   - Indexes: ${objects.indexes.length}`);
      console.log(`   - Foreign Keys: ${objects.foreignKeys.length}`);
      
      if (objects.enums.length === 0 && objects.tables.length === 0) {
        console.log('   ⚠️  No objects to check (migration may be data-only)');
        console.log('   ℹ️  Marking as rolled-back to allow re-run...');
        
        const { execSync } = require('child_process');
        try {
          execSync(`npx prisma migrate resolve --rolled-back ${migrationName}`, {
            stdio: 'inherit',
            env: { ...process.env }
          });
          console.log(`   ✅ Migration ${migrationName} marked as rolled-back`);
        } catch (error) {
          console.error(`   ❌ Failed to resolve migration: ${error.message}`);
          throw error;
        }
        continue;
      }
      
      // Check if objects exist
      const results = await checkMigrationObjects(prisma, migrationName, objects);
      
      // Report results
      console.log(`\n   📊 Object existence check:`);
      
      let allExist = true;
      let someExist = false;
      
      // Check enums
      for (const [enumName, exists] of Object.entries(results.enums)) {
        console.log(`   - Enum "${enumName}": ${exists ? '✅' : '❌'}`);
        if (!exists) allExist = false;
        if (exists) someExist = true;
      }
      
      // Check tables
      for (const [tableName, exists] of Object.entries(results.tables)) {
        console.log(`   - Table "${tableName}": ${exists ? '✅' : '❌'}`);
        if (!exists) allExist = false;
        if (exists) someExist = true;
      }
      
      // Check indexes
      for (const [indexName, exists] of Object.entries(results.indexes)) {
        console.log(`   - Index "${indexName}": ${exists ? '✅' : '❌'}`);
        if (!exists) allExist = false;
        if (exists) someExist = true;
      }
      
      // Check foreign keys
      for (const [fkName, exists] of Object.entries(results.foreignKeys)) {
        console.log(`   - Foreign Key "${fkName}": ${exists ? '✅' : '❌'}`);
        if (!exists) allExist = false;
        if (exists) someExist = true;
      }
      
      // Decision logic
      if (allExist) {
        // All objects exist - mark as APPLIED
        console.log(`\n   ✅ VERDICT: All objects exist - marking as APPLIED`);
        console.log('   ℹ️  Migration succeeded, Prisma just marked it as failed');
        
        const { execSync } = require('child_process');
        try {
          execSync(`npx prisma migrate resolve --applied ${migrationName}`, {
            stdio: 'inherit',
            env: { ...process.env }
          });
          console.log(`   ✅ Migration ${migrationName} marked as applied`);
        } catch (error) {
          console.error(`   ❌ Failed to resolve migration: ${error.message}`);
          throw error;
        }
      } else if (someExist) {
        // Partial application - FAIL HARD
        console.error(`\n   ❌ VERDICT: PARTIAL APPLICATION DETECTED`);
        console.error('   🚨 Some objects exist, some are missing.');
        console.error('   🚨 This requires MANUAL INTERVENTION.');
        console.error('');
        console.error('   Migration objects are in inconsistent state.');
        console.error('   Cannot automatically resolve - manual fix required.');
        console.error('');
        console.error('   Options:');
        console.error('   1. Manually create missing objects');
        console.error('   2. Manually remove existing objects and re-run migration');
        console.error('   3. Contact database administrator');
        throw new Error(`Partial application detected for migration ${migrationName}`);
      } else {
        // No objects exist - mark as rolled-back
        console.log(`\n   ⚠️  VERDICT: No objects exist - marking as ROLLED_BACK`);
        console.log('   ℹ️  Migration can be safely re-run');
        
        const { execSync } = require('child_process');
        try {
          execSync(`npx prisma migrate resolve --rolled-back ${migrationName}`, {
            stdio: 'inherit',
            env: { ...process.env }
          });
          console.log(`   ✅ Migration ${migrationName} marked as rolled-back`);
        } catch (error) {
          console.error(`   ❌ Failed to resolve migration: ${error.message}`);
          throw error;
        }
      }
    }
    
    console.log('\n✅ All failed migrations processed');
    
  } catch (error) {
    console.error('\n❌ Failed to resolve migrations:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================================
// MAIN RESOLUTION FLOW
// ============================================================================

async function main() {
  // Guards already executed at top of file
  
  // Generate Prisma client first
  const { execSync } = require('child_process');
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', {
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log('✅ Prisma client generated\n');
  
  // Resolve failed migrations
  await resolveFailedMigrations();
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ MIGRATION RESOLUTION COMPLETED');
  console.log('='.repeat(80));
  console.log('\nSafe to proceed with deploy-db.js\n');
}

// Run resolution
if (require.main === module) {
  main().catch((error) => {
    console.error('\n❌ Migration resolution failed:', error.message);
    process.exit(1);
  });
}

module.exports = { main, parseMigrationSQL, checkMigrationObjects };
