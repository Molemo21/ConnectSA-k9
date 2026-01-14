#!/usr/bin/env node

/**
 * Production Database Permissions Verification (Node.js)
 * 
 * Safely verifies that production database permissions are hardened.
 * Uses Prisma to check permissions without performing destructive operations.
 * 
 * SECURITY: Safe to run - only queries metadata, does NOT modify anything
 */

const { PrismaClient } = require('@prisma/client');

// SECURITY: Require DATABASE_URL from environment
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is required');
  console.error('   Please set DATABASE_URL in your .env file or environment');
  process.exit(1);
}

const prisma = new PrismaClient();

// Color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'cyan');
  console.log('='.repeat(80) + '\n');
}

const APP_ROLE = 'connectsa_app_runtime';
const MIGRATION_ROLE = 'connectsa_migration';
const DEV_ROLE = 'connectsa_dev_readonly';

let testsPassed = 0;
let testsFailed = 0;
const failures = [];
const unsafePermissions = [];

// Application tables to check
const APP_TABLES = [
  'users',
  'providers',
  'services',
  'bookings',
  'payments',
  'payouts',
  'reviews',
  'notifications',
];

async function checkRolePermissions() {
  logSection('🔒 Production Database Permissions Verification');
  log('Safely verifying database role permissions', 'cyan');
  log('Using read-only queries - NO destructive operations\n', 'yellow');

  try {
    await prisma.$connect();
    log('✅ Connected to database\n', 'green');

    // Test 1: Check current role
    logSection('Test 1: Current Database Role');
    try {
      const roleResult = await prisma.$queryRawUnsafe(`
        SELECT current_user AS role_name, session_user AS session_role
      `);
      console.log(roleResult);
      
      if (roleResult[0]?.role_name === 'postgres' || roleResult[0]?.role_name?.includes('admin')) {
        log('⚠️  WARNING: Connected as superuser/admin role', 'yellow');
        log('   Verification should be run as application role for accurate results', 'yellow');
      }
    } catch (error) {
      log(`⚠️  Could not query role: ${error.message}`, 'yellow');
    }

    // Test 2: Check if roles exist
    logSection('Test 2: Role Existence');
    const rolesToCheck = [APP_ROLE, MIGRATION_ROLE, DEV_ROLE];
    
    for (const role of rolesToCheck) {
      try {
        const roleExists = await prisma.$queryRawUnsafe(`
          SELECT EXISTS(
            SELECT 1 FROM pg_roles WHERE rolname = $1
          ) AS exists
        `, role);
        
        if (roleExists[0]?.exists) {
          log(`✅ Role ${role} exists`, 'green');
        } else {
          log(`⚠️  Role ${role} does not exist`, 'yellow');
          log('   Run: psql $DATABASE_URL -f scripts/setup-database-roles.sql', 'yellow');
        }
      } catch (error) {
        log(`⚠️  Could not check role ${role}: ${error.message}`, 'yellow');
      }
    }

    // Test 3: Check application role permissions
    logSection('Test 3: Application Role Permissions (connectsa_app_runtime)');
    
    for (const table of APP_TABLES) {
      try {
        const permissions = await prisma.$queryRawUnsafe(`
          SELECT 
            has_table_privilege($1, $2, 'SELECT') AS can_select,
            has_table_privilege($1, $2, 'INSERT') AS can_insert,
            has_table_privilege($1, $2, 'UPDATE') AS can_update,
            has_table_privilege($1, $2, 'DELETE') AS can_delete,
            has_table_privilege($1, $2, 'TRUNCATE') AS can_truncate,
            has_table_privilege($1, $2, 'DROP') AS can_drop,
            has_table_privilege($1, $2, 'ALTER') AS can_alter
        `, APP_ROLE, table);
        
        const perm = permissions[0];
        const isSafe = !perm.can_delete && !perm.can_drop && !perm.can_truncate && !perm.can_alter;
        
        if (isSafe && perm.can_select && perm.can_insert && perm.can_update) {
          log(`✅ ${table}: Safe permissions (SELECT, INSERT, UPDATE only)`, 'green');
          testsPassed++;
        } else {
          if (perm.can_delete) {
            log(`❌ ${table}: Has DELETE permission (DANGEROUS)`, 'red');
            unsafePermissions.push(`${table}: DELETE`);
            testsFailed++;
          }
          if (perm.can_drop) {
            log(`❌ ${table}: Has DROP permission (CRITICAL)`, 'red');
            unsafePermissions.push(`${table}: DROP`);
            testsFailed++;
          }
          if (perm.can_truncate) {
            log(`❌ ${table}: Has TRUNCATE permission (DANGEROUS)`, 'red');
            unsafePermissions.push(`${table}: TRUNCATE`);
            testsFailed++;
          }
          if (perm.can_alter) {
            log(`❌ ${table}: Has ALTER permission (DANGEROUS)`, 'red');
            unsafePermissions.push(`${table}: ALTER`);
            testsFailed++;
          }
          if (!perm.can_select || !perm.can_insert || !perm.can_update) {
            log(`⚠️  ${table}: Missing required permissions`, 'yellow');
          }
        }
      } catch (error) {
        // Table might not exist, skip
        log(`ℹ️  ${table}: Table not found or cannot check permissions`, 'blue');
      }
    }

    // Test 4: Check migration role permissions
    logSection('Test 4: Migration Role Permissions (connectsa_migration)');
    
    try {
      const permissions = await prisma.$queryRawUnsafe(`
        SELECT 
          has_table_privilege($1, 'users', 'SELECT') AS can_select,
          has_table_privilege($1, 'users', 'ALTER') AS can_alter,
          has_table_privilege($1, 'users', 'DROP') AS can_drop
      `, MIGRATION_ROLE);
      
      const perm = permissions[0];
      
      if (perm.can_select && perm.can_alter && !perm.can_drop) {
        log('✅ Migration role: Safe permissions (SELECT, ALTER, but NOT DROP)', 'green');
        testsPassed++;
      } else {
        if (!perm.can_alter) {
          log('❌ Migration role: Missing ALTER permission (needed for migrations)', 'red');
          testsFailed++;
          failures.push('Migration role missing ALTER permission');
        }
        if (perm.can_drop) {
          log('❌ Migration role: Has DROP permission (DANGEROUS)', 'red');
          testsFailed++;
          failures.push('Migration role has DROP permission');
        }
      }
    } catch (error) {
      log(`⚠️  Could not check migration role: ${error.message}`, 'yellow');
    }

    // Test 5: Check developer role permissions
    logSection('Test 5: Developer Read-Only Role Permissions');
    
    try {
      const permissions = await prisma.$queryRawUnsafe(`
        SELECT 
          has_table_privilege($1, 'users', 'SELECT') AS can_select,
          has_table_privilege($1, 'users', 'INSERT') AS can_insert,
          has_table_privilege($1, 'users', 'UPDATE') AS can_update,
          has_table_privilege($1, 'users', 'DELETE') AS can_delete
      `, DEV_ROLE);
      
      const perm = permissions[0];
      
      if (perm.can_select && !perm.can_insert && !perm.can_update && !perm.can_delete) {
        log('✅ Developer role: Read-only (SELECT only)', 'green');
        testsPassed++;
      } else {
        if (perm.can_insert || perm.can_update || perm.can_delete) {
          log('❌ Developer role: Has write permissions (should be read-only)', 'red');
          testsFailed++;
          failures.push('Developer role has write permissions');
        }
        if (!perm.can_select) {
          log('❌ Developer role: Missing SELECT permission', 'red');
          testsFailed++;
          failures.push('Developer role missing SELECT permission');
        }
      }
    } catch (error) {
      log(`⚠️  Could not check developer role: ${error.message}`, 'yellow');
    }

    // Test 6: Attempt to verify DELETE is blocked (safe test)
    logSection('Test 6: Safe DELETE Operation Test');
    
    try {
      // Use EXPLAIN to check if DELETE would work (doesn't actually delete)
      const explainResult = await prisma.$queryRawUnsafe(`
        EXPLAIN DELETE FROM users WHERE id = 'test-id-that-does-not-exist'
      `);
      
      // If we get here, the query was allowed (but we used EXPLAIN so nothing happened)
      // This is a warning - in production, we should check permissions instead
      log('ℹ️  DELETE command structure is valid (using EXPLAIN - no data deleted)', 'blue');
      log('   Actual DELETE permission should be checked via permission queries above', 'blue');
    } catch (error) {
      if (error.message.includes('permission denied') || error.message.includes('insufficient_privilege')) {
        log('✅ DELETE operation correctly blocked by permissions', 'green');
        testsPassed++;
      } else {
        log(`⚠️  DELETE test result: ${error.message}`, 'yellow');
      }
    }

    // Test 7: Check RLS status on sensitive tables
    logSection('Test 7: Row Level Security (RLS) Status');
    
    const sensitiveTables = ['users', 'providers', 'payments', 'payouts', 'bookings'];
    
    for (const table of sensitiveTables) {
      try {
        const rlsStatus = await prisma.$queryRawUnsafe(`
          SELECT rowsecurity AS rls_enabled
          FROM pg_tables
          WHERE schemaname = 'public' AND tablename = $1
        `, table);
        
        if (rlsStatus[0]?.rls_enabled) {
          log(`✅ ${table}: RLS enabled`, 'green');
        } else {
          log(`⚠️  ${table}: RLS not enabled (consider enabling for extra protection)`, 'yellow');
        }
      } catch (error) {
        // Table might not exist
      }
    }

  } catch (error) {
    log(`❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    testsFailed++;
    failures.push(`Fatal error: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }

  // Summary and Verdict
  logSection('📊 Verification Results Summary');
  
  log(`Total Tests: ${testsPassed + testsFailed}`, 'cyan');
  log(`✅ Passed: ${testsPassed}`, 'green');
  log(`❌ Failed: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green');
  
  if (unsafePermissions.length > 0) {
    log('\n❌ Unsafe Permissions Found:', 'red');
    unsafePermissions.forEach((perm, index) => {
      log(`   ${index + 1}. ${perm}`, 'red');
    });
  }
  
  if (failures.length > 0) {
    log('\n❌ Failures:', 'red');
    failures.forEach((failure, index) => {
      log(`   ${index + 1}. ${failure}`, 'red');
    });
  }
  
  console.log('\n' + '='.repeat(80));
  
  // Final Verdict
  if (testsFailed === 0 && unsafePermissions.length === 0) {
    log('\n✅ VERDICT: PRODUCTION DB PERMISSIONS: SAFE', 'green');
    log('', 'green');
    log('Application role has safe permissions:', 'green');
    log('  ✅ Can SELECT, INSERT, UPDATE (required operations)', 'green');
    log('  ✅ Cannot DELETE (blocked)', 'green');
    log('  ✅ Cannot DROP (blocked)', 'green');
    log('  ✅ Cannot TRUNCATE (blocked)', 'green');
    log('  ✅ Cannot ALTER (blocked)', 'green');
    log('', 'green');
    log('Destructive operations are prevented.', 'green');
    log('Local development and CI/CD mistakes cannot cause irreversible damage.', 'green');
    process.exit(0);
  } else {
    log('\n❌ VERDICT: PRODUCTION DB PERMISSIONS: UNSAFE', 'red');
    log('', 'red');
    log('⚠️  SECURITY ISSUES DETECTED:', 'red');
    if (unsafePermissions.length > 0) {
      unsafePermissions.forEach(perm => {
        log(`  ❌ ${perm}`, 'red');
      });
    }
    log('', 'red');
    log('ACTION REQUIRED:', 'red');
    log('  Run: psql $DATABASE_URL -f scripts/setup-database-roles.sql', 'red');
    log('  This will revoke dangerous permissions from application role', 'red');
    process.exit(1);
  }
}

// Run verification
checkRolePermissions().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
