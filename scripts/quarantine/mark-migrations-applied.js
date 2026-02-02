#!/usr/bin/env node

/**
 * Mark all local Prisma migrations as applied.
 * Use this after manually applying the full schema SQL in Supabase SQL Editor.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Read migration directories; using local Prisma client
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

console.log('\n⚠️  IMPORTANT: Make sure you have already run full-schema.sql in Supabase SQL Editor!');
console.log('   If not, do that first before proceeding.\n');

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

    for (const migrationName of migrationDirs) {
      try {
        // Check if migration already exists
        const existing = await prisma.$queryRaw`
          SELECT name FROM _prisma_migrations WHERE name = ${migrationName}
        `;

        if (existing.length > 0) {
          console.log(`⏭️  Already marked: ${migrationName}`);
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

    console.log(`\n🎉 Successfully marked ${markedCount} migrations as applied!`);
    console.log('📊 You can now verify with: npx prisma migrate status\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. full-schema.sql has been executed in Supabase SQL Editor');
    console.error('   2. DATABASE_URL is correctly set in your .env');
    console.error('   3. The database is accessible\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Confirm before proceeding
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Have you already run full-schema.sql in Supabase SQL Editor? (yes/no): ', async (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    rl.close();
    await markMigrationsAsApplied();
  } else {
    console.log('\n⚠️  Please run full-schema.sql in Supabase SQL Editor first, then run this script again.');
    rl.close();
    process.exit(0);
  }
});

