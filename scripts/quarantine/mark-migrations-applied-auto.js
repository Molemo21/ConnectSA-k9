#!/usr/bin/env node

/**
 * Automatically mark all local Prisma migrations as applied.
 * Use this after manually applying the full schema SQL in Supabase SQL Editor.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Read migration directories
const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
const migrationDirs = fs
  .readdirSync(migrationsDir, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name !== 'production')
  .map(d => d.name)
  .sort();

console.log(`📋 Found ${migrationDirs.length} migrations to mark as applied:\n`);
migrationDirs.forEach((dir, i) => {
  console.log(`  ${i + 1}. ${dir}`);
});
console.log('\n');

// Use Prisma client to mark migrations as applied
async function markMigrationsAsApplied() {
  const prisma = new PrismaClient({
    log: ['error'],
    errorFormat: 'pretty'
  });

  try {
    // Test connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful\n');

    let markedCount = 0;
    let skippedCount = 0;

    for (const migrationName of migrationDirs) {
      try {
        // Check if migration already exists
        const existing = await prisma.$queryRaw`
          SELECT migration_name FROM _prisma_migrations WHERE migration_name = ${migrationName}
        `;

        if (existing.length > 0) {
          console.log(`⏭️  Already marked: ${migrationName}`);
          skippedCount++;
          continue;
        }

        // Insert migration record
        await prisma.$executeRaw`
          INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
          VALUES (gen_random_uuid()::text, '', NOW(), ${migrationName}, NULL, NULL, NOW(), 1)
        `;

        console.log(`✅ Marked as applied: ${migrationName}`);
        markedCount++;

      } catch (error) {
        console.error(`❌ Failed to mark ${migrationName}:`, error.message);
      }
    }

    console.log(`\n🎉 Migration marking completed!`);
    console.log(`✅ Newly marked: ${markedCount}`);
    console.log(`⏭️  Already marked: ${skippedCount}`);
    console.log(`📊 Total processed: ${migrationDirs.length}\n`);
    
    if (markedCount > 0) {
      console.log('✅ You can now verify with: npx prisma migrate status\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. safe-schema-sync.sql has been executed in Supabase SQL Editor');
    console.error('   2. DATABASE_URL is correctly set in your .env');
    console.error('   3. The database is accessible\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run automatically
markMigrationsAsApplied().catch(err => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});

