#!/usr/bin/env node

/**
 * Diagnose Migration Mismatch
 * 
 * This script compares:
 * 1. Migration directories in prisma/migrations
 * 2. Migrations in _prisma_migrations table
 * 3. Identifies mismatches that cause P3015 errors
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

async function diagnoseMismatch() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 DIAGNOSING MIGRATION MISMATCH');
  console.log('='.repeat(80));
  
  const prisma = new PrismaClient();
  
  try {
    // Step 1: Get local migration directories
    const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations');
    const localDirs = fs.readdirSync(migrationsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && dirent.name !== 'production')
      .map(dirent => dirent.name)
      .sort();
    
    console.log(`\n📁 Local migration directories (${localDirs.length}):`);
    for (const dir of localDirs) {
      const hasFile = fs.existsSync(path.join(migrationsDir, dir, 'migration.sql'));
      const status = hasFile ? '✅' : '❌ MISSING migration.sql';
      console.log(`   ${status} ${dir}`);
    }
    
    // Step 2: Get migrations from database
    let dbMigrations = [];
    try {
      const result = await prisma.$queryRawUnsafe(
        `SELECT migration_name, finished_at, started_at 
         FROM _prisma_migrations 
         ORDER BY migration_name`
      );
      dbMigrations = Array.isArray(result) ? result.map(r => r.migration_name || r.migrationName) : [];
    } catch (error) {
      if (error.message.includes('does not exist')) {
        console.log('\n⚠️  _prisma_migrations table does not exist - database not initialized');
        return;
      }
      throw error;
    }
    
    console.log(`\n🗄️  Database migrations (${dbMigrations.length}):`);
    for (const migration of dbMigrations) {
      console.log(`   - ${migration}`);
    }
    
    // Step 3: Compare
    console.log('\n📊 Comparison:');
    
    const localSet = new Set(localDirs);
    const dbSet = new Set(dbMigrations);
    
    const inDbNotLocal = dbMigrations.filter(m => !localSet.has(m));
    const inLocalNotDb = localDirs.filter(d => !dbSet.has(d));
    
    if (inDbNotLocal.length > 0) {
      console.log(`\n❌ Migrations in database but NOT in local filesystem (${inDbNotLocal.length}):`);
      for (const migration of inDbNotLocal) {
        console.log(`   - ${migration}`);
        console.log(`     ⚠️  This causes P3015 error - Prisma expects migration.sql but can't find it`);
      }
    }
    
    if (inLocalNotDb.length > 0) {
      console.log(`\n⚠️  Migrations in local filesystem but NOT in database (${inLocalNotDb.length}):`);
      for (const migration of inLocalNotDb) {
        console.log(`   - ${migration}`);
        console.log(`     ℹ️  This is OK - will be applied during deploy`);
      }
    }
    
    if (inDbNotLocal.length === 0 && inLocalNotDb.length === 0) {
      console.log('✅ All migrations are in sync');
    }
    
    // Step 4: Check for empty directories
    const emptyDirs = localDirs.filter(dir => {
      return !fs.existsSync(path.join(migrationsDir, dir, 'migration.sql'));
    });
    
    if (emptyDirs.length > 0) {
      console.log(`\n❌ Empty migration directories (missing migration.sql) (${emptyDirs.length}):`);
      for (const dir of emptyDirs) {
        console.log(`   - ${dir}`);
      }
    }
    
    // Step 5: Recommendations
    if (inDbNotLocal.length > 0 || emptyDirs.length > 0) {
      console.log('\n🔧 Recommendations:');
      
      if (inDbNotLocal.length > 0) {
        console.log('\n   For migrations in database but not local:');
        console.log('   1. Check if migration was applied manually');
        console.log('   2. If migration objects exist, mark as applied:');
        for (const migration of inDbNotLocal) {
          console.log(`      npx prisma migrate resolve --applied ${migration}`);
        }
        console.log('   3. If migration failed, mark as rolled-back:');
        for (const migration of inDbNotLocal) {
          console.log(`      npx prisma migrate resolve --rolled-back ${migration}`);
        }
      }
      
      if (emptyDirs.length > 0) {
        console.log('\n   For empty migration directories:');
        console.log('   1. Delete empty directories:');
        for (const dir of emptyDirs) {
          console.log(`      rm -rf prisma/migrations/${dir}`);
        }
        console.log('   2. Or restore missing migration.sql files');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Diagnosis failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  diagnoseMismatch().catch((error) => {
    console.error('\n❌ Diagnosis failed:', error.message);
    process.exit(1);
  });
}

module.exports = { diagnoseMismatch };
