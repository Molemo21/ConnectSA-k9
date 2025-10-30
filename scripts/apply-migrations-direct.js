#!/usr/bin/env node

/**
 * Apply Prisma migration SQLs directly using the DIRECT_URL connection.
 * - Skips already applied migrations by checking _prisma_migrations table
 * - Applies remaining migration.sql files in chronological order with psql
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const directUrl = process.env.DIRECT_URL;
  if (!directUrl) {
    console.error('❌ DIRECT_URL is not set. Please set DIRECT_URL to your direct (port 5432) connection string.');
    process.exit(1);
  }

  console.log('🔗 Using DIRECT_URL for migrations');

  // Prisma client pointed at DIRECT_URL for metadata queries
  const prisma = new PrismaClient({
    datasources: {
      db: { url: directUrl },
    },
    log: ['error'],
    errorFormat: 'pretty',
  });

  try {
    // 1) Verify direct connection quickly
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Direct DB connection OK');

    // 2) Read applied migrations from _prisma_migrations
    let applied = [];
    try {
      const rows = await prisma.$queryRaw`SELECT name FROM _prisma_migrations ORDER BY finished_at NULLS LAST, name`;
      applied = rows.map(r => r.name);
    } catch (e) {
      // Table may not exist on a fresh DB; create it by running the first migration if needed
      console.warn('⚠️ Could not read _prisma_migrations; proceeding as if none are applied');
      applied = [];
    }

    // 3) Find local migration directories
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.error('❌ prisma/migrations directory not found');
      process.exit(1);
    }

    const migrationDirs = fs
      .readdirSync(migrationsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .sort(); // chronological by default (timestamp prefix)

    // 4) Apply pending migrations
    let appliedCount = 0;
    for (const dir of migrationDirs) {
      const migrationName = dir;
      if (applied.includes(migrationName)) {
        console.log(`⏭️  Skipping already applied: ${migrationName}`);
        continue;
      }

      const sqlFile = path.join(migrationsDir, dir, 'migration.sql');
      if (!fs.existsSync(sqlFile)) {
        console.warn(`⚠️ No migration.sql found for ${migrationName}, skipping`);
        continue;
      }

      console.log(`🚀 Applying migration: ${migrationName}`);
      try {
        // Use psql with ON_ERROR_STOP to fail fast; rely on DIRECT_URL for auth/ssl
        // Windows Git Bash compatible quoting
        const command = `psql "${directUrl}" -v ON_ERROR_STOP=1 -f "${sqlFile}"`;
        execSync(command, { stdio: 'inherit' });
        appliedCount += 1;
      } catch (err) {
        console.error(`❌ Failed applying ${migrationName}:`, err.message || err);
        process.exit(1);
      }
    }

    console.log(`🎉 Direct SQL migration complete. Newly applied: ${appliedCount}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(err => {
  console.error('❌ Migration script failed:', err);
  process.exit(1);
});



