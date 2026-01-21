#!/usr/bin/env node

/**
 * Resolve Applied Migrations (CI-ONLY)
 * 
 * This script detects failed migrations and checks if their objects already exist.
 * If all objects exist, marks migration as APPLIED.
 * If only indexes are missing, creates them automatically (smart recovery).
 * If critical objects (tables, enums, FKs) are missing, fails hard.
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
 *   1 = Critical objects missing (manual intervention required)
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
// NOTE: PrismaClient is NOT imported here - it will be lazy-imported
//       AFTER prisma generate runs in main() to prevent initialization errors

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

/**
 * Extract CREATE INDEX SQL statement for a specific index name
 * Returns the full SQL statement including table and columns
 */
function extractIndexSQL(sqlContent, indexName) {
  const lines = sqlContent.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if this line contains the index name and CREATE INDEX
    if (line.includes(`"${indexName}"`) && line.includes('CREATE')) {
      // Found the index creation line - may span multiple lines
      let fullSQL = line;
      let j = i + 1;
      
      // Continue until we find the semicolon
      while (j < lines.length && !fullSQL.trim().endsWith(';')) {
        const nextLine = lines[j].trim();
        if (nextLine) {
          fullSQL += ' ' + nextLine;
        }
        j++;
        // Safety limit
        if (j - i > 20) break;
      }
      
      return fullSQL.trim();
    }
  }
  
  return null;
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
  console.log('   - If all objects exist: marks as APPLIED');
  console.log('   - If only indexes missing: creates them automatically (smart recovery)');
  console.log('   - If critical objects missing: fails hard (manual intervention)\n');
  
  // ============================================================================
  // LAZY IMPORT: PrismaClient imported AFTER prisma generate has run
  // ============================================================================
  let PrismaClient;
  let prisma;
  
  try {
    console.log('📦 Loading Prisma Client (after generation)...');
    PrismaClient = require('@prisma/client').PrismaClient;
    
    if (!PrismaClient) {
      throw new Error('PrismaClient not found in @prisma/client module');
    }
    
    prisma = new PrismaClient();
    console.log('✅ Prisma Client loaded and instantiated');
  } catch (error) {
    console.error('\n❌ CRITICAL: Failed to import or instantiate PrismaClient');
    console.error('   This indicates Prisma client was not generated correctly.');
    console.error('');
    console.error('   Error details:');
    console.error(`   ${error.message}`);
    console.error('');
    console.error('   Troubleshooting:');
    console.error('   1. Ensure npx prisma generate ran successfully');
    console.error('   2. Check that @prisma/client is installed');
    console.error('   3. Verify DATABASE_URL and DIRECT_URL are set correctly');
    console.error('   4. Check Prisma schema is valid');
    console.error('');
    process.exit(1);
  }
  
  try {
    // Step 1: Find failed migrations
    console.log('\n📋 Step 1: Finding failed migrations...');
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
    
    console.log(`⚠️  Found ${failedMigrations.length} failed migration entry/entries:`);
    for (const migration of failedMigrations) {
      const name = migration.migration_name || migration.migrationName;
      const started = migration.started_at || migration.startedAt;
      console.log(`   - ${name} (started: ${started})`);
    }
    
    // DEDUPLICATE: Group by migration_name, keep only the most recent attempt
    const migrationMap = new Map();
    for (const migration of failedMigrations) {
      const name = migration.migration_name || migration.migrationName;
      if (!migrationMap.has(name)) {
        migrationMap.set(name, migration);
      } else {
        // Keep the most recent one (already sorted DESC by started_at)
        const existing = migrationMap.get(name);
        const existingStarted = existing.started_at || existing.startedAt;
        const currentStarted = migration.started_at || migration.startedAt;
        if (currentStarted > existingStarted) {
          migrationMap.set(name, migration);
        }
      }
    }
    
    const uniqueMigrations = Array.from(migrationMap.values());
    
    if (uniqueMigrations.length < failedMigrations.length) {
      console.log(`\n   ℹ️  Deduplicated: Processing ${uniqueMigrations.length} unique migration(s) (ignored ${failedMigrations.length - uniqueMigrations.length} duplicate attempt(s))`);
    }
    
    // Step 2: Check each failed migration
    console.log('\n📋 Step 2: Checking migration objects...');
    const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations');
    
    for (const migration of uniqueMigrations) {
      const migrationName = migration.migration_name || migration.migrationName;
      const started = migration.started_at || migration.startedAt;
      
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`🔍 Analyzing migration: ${migrationName}`);
      console.log(`   Started at: ${started}`);
      
      // Find migration SQL file
      const migrationPath = path.join(migrationsDir, migrationName, 'migration.sql');
      
      if (!fs.existsSync(migrationPath)) {
        console.warn(`   ⚠️  Migration SQL file not found: ${migrationPath}`);
        console.warn('   ℹ️  This migration may have been applied manually or deleted.');
        console.warn('   ℹ️  Marking as rolled-back to allow re-run...');
        
        // Mark as rolled-back if file doesn't exist
        const { execSync } = require('child_process');
        try {
          const command = `npx prisma migrate resolve --rolled-back ${migrationName}`;
          console.log(`   📝 Executing: ${command}`);
          execSync(command, {
            stdio: 'inherit',
            env: { ...process.env }
          });
          console.log(`   ✅ Migration ${migrationName} marked as rolled-back`);
          console.log(`   📊 Status: ROLLED_BACK (file not found)`);
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
          const command = `npx prisma migrate resolve --rolled-back ${migrationName}`;
          console.log(`   📝 Executing: ${command}`);
          execSync(command, {
            stdio: 'inherit',
            env: { ...process.env }
          });
          console.log(`   ✅ Migration ${migrationName} marked as rolled-back`);
          console.log(`   📊 Status: ROLLED_BACK (data-only migration)`);
        } catch (error) {
          console.error(`   ❌ Failed to resolve migration: ${error.message}`);
          throw error;
        }
        continue;
      }
      
      // Check if objects exist
      const results = await checkMigrationObjects(prisma, migrationName, objects);
      
      // Report results and categorize missing objects
      console.log(`\n   📊 Object existence check:`);
      
      const missingEnums = [];
      const missingTables = [];
      const missingIndexes = [];
      const missingForeignKeys = [];
      
      // Check enums
      for (const [enumName, exists] of Object.entries(results.enums)) {
        const status = exists ? '✅' : '❌';
        console.log(`   - Enum "${enumName}": ${status}`);
        if (!exists) missingEnums.push(enumName);
      }
      
      // Check tables
      for (const [tableName, exists] of Object.entries(results.tables)) {
        const status = exists ? '✅' : '❌';
        console.log(`   - Table "${tableName}": ${status}`);
        if (!exists) missingTables.push(tableName);
      }
      
      // Check indexes
      for (const [indexName, exists] of Object.entries(results.indexes)) {
        const status = exists ? '✅' : '❌';
        console.log(`   - Index "${indexName}": ${status}`);
        if (!exists) missingIndexes.push(indexName);
      }
      
      // Check foreign keys
      for (const [fkName, exists] of Object.entries(results.foreignKeys)) {
        const status = exists ? '✅' : '❌';
        console.log(`   - Foreign Key "${fkName}": ${status}`);
        if (!exists) missingForeignKeys.push(fkName);
      }
      
      // Decision logic with smart recovery for indexes
      if (missingEnums.length === 0 && missingTables.length === 0 && missingIndexes.length === 0 && missingForeignKeys.length === 0) {
        // All objects exist - mark as APPLIED
        console.log(`\n   ✅ VERDICT: All objects exist - marking as APPLIED`);
        console.log('   ℹ️  Migration succeeded, Prisma just marked it as failed');
        
        const { execSync } = require('child_process');
        try {
          const command = `npx prisma migrate resolve --applied ${migrationName}`;
          console.log(`   📝 Executing: ${command}`);
          execSync(command, {
            stdio: 'inherit',
            env: { ...process.env }
          });
          console.log(`   ✅ Migration ${migrationName} marked as applied`);
          console.log(`   📊 Status: APPLIED (all objects exist)`);
        } catch (error) {
          console.error(`   ❌ Failed to resolve migration: ${error.message}`);
          throw error;
        }
      } else if (missingEnums.length > 0 || missingTables.length > 0 || missingForeignKeys.length > 0) {
        // Critical objects missing - FAIL HARD
        console.error(`\n   ❌ VERDICT: PARTIAL APPLICATION DETECTED (CRITICAL OBJECTS MISSING)`);
        console.error('   🚨 Critical objects (enums, tables, foreign keys) are missing.');
        console.error('   🚨 This requires MANUAL INTERVENTION.');
        console.error('');
        console.error('   Missing critical objects:');
        if (missingEnums.length > 0) {
          console.error(`   - Missing enums: ${missingEnums.join(', ')}`);
        }
        if (missingTables.length > 0) {
          console.error(`   - Missing tables: ${missingTables.join(', ')}`);
        }
        if (missingForeignKeys.length > 0) {
          console.error(`   - Missing foreign keys: ${missingForeignKeys.join(', ')}`);
        }
        if (missingIndexes.length > 0) {
          console.error(`   - Missing indexes (non-critical): ${missingIndexes.join(', ')}`);
        }
        console.error('');
        console.error('   Migration objects are in inconsistent state.');
        console.error('   Cannot automatically resolve - manual fix required.');
        console.error('');
        console.error('   Manual intervention options:');
        console.error('   1. Manually create missing critical objects using migration SQL');
        console.error('   2. Manually remove existing objects and re-run migration');
        console.error('   3. Contact database administrator for assistance');
        console.error('');
        console.error(`   📊 Status: MANUAL INTERVENTION REQUIRED`);
        throw new Error(`Partial application detected for migration ${migrationName} - critical objects missing`);
      } else if (missingIndexes.length > 0) {
        // Only indexes missing - SMART RECOVERY: Create them automatically
        console.log(`\n   ⚠️  VERDICT: Only indexes missing - attempting smart recovery`);
        console.log(`   Missing indexes: ${missingIndexes.join(', ')}`);
        console.log('   ℹ️  Indexes are non-critical and can be safely created.');
        console.log('   🔧 Creating missing indexes idempotently...');
        
        try {
          // Create each missing index
          for (const missingIndex of missingIndexes) {
            const indexSQL = extractIndexSQL(sqlContent, missingIndex);
            
            if (!indexSQL) {
              console.warn(`   ⚠️  Could not find SQL for index "${missingIndex}" - skipping`);
              continue;
            }
            
            // Make it idempotent with IF NOT EXISTS
            let idempotentSQL = indexSQL;
            
            // Handle CREATE UNIQUE INDEX
            if (indexSQL.includes('CREATE UNIQUE INDEX')) {
              idempotentSQL = indexSQL.replace(/CREATE\s+UNIQUE\s+INDEX/, 'CREATE UNIQUE INDEX IF NOT EXISTS');
            } else if (indexSQL.includes('CREATE INDEX')) {
              idempotentSQL = indexSQL.replace(/CREATE\s+INDEX/, 'CREATE INDEX IF NOT EXISTS');
            }
            
            console.log(`   📝 Creating index: ${missingIndex}`);
            console.log(`      SQL: ${idempotentSQL.substring(0, 100)}...`);
            
            await prisma.$executeRawUnsafe(idempotentSQL);
            console.log(`   ✅ Index "${missingIndex}" created successfully`);
          }
          
          // Verify all indexes were created
          console.log(`\n   🔍 Verifying all indexes were created...`);
          const verifyResults = await checkMigrationObjects(prisma, migrationName, { indexes: missingIndexes, enums: [], tables: [], foreignKeys: [] });
          
          const stillMissing = Object.entries(verifyResults.indexes).filter(([_, exists]) => !exists).map(([name]) => name);
          
          if (stillMissing.length > 0) {
            throw new Error(`Failed to create indexes: ${stillMissing.join(', ')}`);
          }
          
          console.log(`   ✅ All missing indexes verified as created`);
          
          // After creating indexes, mark migration as APPLIED
          console.log(`\n   📝 Marking migration as APPLIED...`);
          const { execSync } = require('child_process');
          const command = `npx prisma migrate resolve --applied ${migrationName}`;
          console.log(`   📝 Executing: ${command}`);
          execSync(command, {
            stdio: 'inherit',
            env: { ...process.env }
          });
          console.log(`   ✅ Migration ${migrationName} marked as applied`);
          console.log(`   📊 Status: APPLIED (indexes recovered automatically)`);
        } catch (error) {
          console.error(`\n   ❌ Failed to create missing indexes: ${error.message}`);
          console.error('   Falling back to manual intervention required.');
          console.error(`   📊 Status: MANUAL INTERVENTION REQUIRED (index creation failed)`);
          throw new Error(`Failed to recover missing indexes for migration ${migrationName}: ${error.message}`);
        }
      } else {
        // No objects exist - mark as rolled-back
        console.log(`\n   ⚠️  VERDICT: No objects exist - marking as ROLLED_BACK`);
        console.log('   ℹ️  Migration can be safely re-run');
        
        const { execSync } = require('child_process');
        try {
          const command = `npx prisma migrate resolve --rolled-back ${migrationName}`;
          console.log(`   📝 Executing: ${command}`);
          execSync(command, {
            stdio: 'inherit',
            env: { ...process.env }
          });
          console.log(`   ✅ Migration ${migrationName} marked as rolled-back`);
          console.log(`   📊 Status: ROLLED_BACK (no objects exist)`);
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
// Execution Order (CRITICAL):
// 1. Guards execute (top of file - BEFORE any imports)
// 2. main() called
// 3. Generate Prisma client (npx prisma generate)
// 4. Lazy import PrismaClient (inside resolveFailedMigrations)
// 5. Resolve migrations (check database state, mark as APPLIED/ROLLED_BACK)
// 6. Exit

async function main() {
  // Step 1: Guards already executed at top of file (BEFORE any imports)
  //         - CI-only check
  //         - NODE_ENV=production check
  
  // Step 2: Generate Prisma client FIRST (before any PrismaClient usage)
  const { execSync } = require('child_process');
  
  console.log('📦 Generating Prisma client...');
  console.log('   This must complete before PrismaClient can be imported.\n');
  
  try {
    execSync('npx prisma generate', {
      stdio: 'inherit',
      env: { ...process.env }
    });
    console.log('\n✅ Prisma client generated successfully');
  } catch (error) {
    console.error('\n❌ CRITICAL: Failed to generate Prisma client');
    console.error('   Prisma client generation is required before migration resolution.');
    console.error('');
    console.error('   Error details:');
    console.error(`   ${error.message}`);
    console.error('');
    console.error('   Troubleshooting:');
    console.error('   1. Check Prisma schema is valid (prisma/schema.prisma)');
    console.error('   2. Verify DATABASE_URL and DIRECT_URL are set');
    console.error('   3. Ensure @prisma/client is in package.json');
    console.error('   4. Check for syntax errors in schema');
    console.error('');
    process.exit(1);
  }
  
  // Step 3: Resolve failed migrations (lazy imports PrismaClient inside)
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

module.exports = { main, parseMigrationSQL, checkMigrationObjects, extractIndexSQL };
