#!/usr/bin/env node
/**
 * Mark the push_subscriptions migration as applied in Prisma
 * Run this AFTER you've manually executed migrations/manual-add-push-subscriptions.sql
 * 
 * Usage: node scripts/mark-push-migration-applied.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function markApplied() {
  try {
    console.log('📝 Marking push_subscriptions migration as applied...\n')

    // Check if _prisma_migrations table exists
    const migrationsTable = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = '_prisma_migrations'
    `

    if (migrationsTable.length === 0) {
      console.log('⚠️  _prisma_migrations table does not exist.')
      console.log('    This is OK for fresh databases. Migration tracking will start from now.\n')
    }

    // Verify the push_subscriptions table exists first
    const tableCheck = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'push_subscriptions'
    `

    if (tableCheck.length === 0) {
      console.log('❌ ERROR: push_subscriptions table does not exist!')
      console.log('📝 Please run migrations/manual-add-push-subscriptions.sql first\n')
      process.exit(1)
    }

    console.log('✅ push_subscriptions table exists')

    // Insert migration record
    const migrationName = '20241221_add_push_subscriptions'
    const migrationId = 'manual-' + Date.now()

    try {
      await prisma.$executeRaw`
        INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
        VALUES (
          ${migrationId},
          '',
          NOW(),
          ${migrationName},
          NOW(),
          1
        )
        ON CONFLICT (migration_name) DO NOTHING
      `
      console.log(`✅ Migration "${migrationName}" marked as applied\n`)
    } catch (err) {
      if (err.message.includes('does not exist')) {
        console.log('ℹ️  _prisma_migrations table not found. This is OK.')
        console.log('    Prisma will track migrations from the next one.\n')
      } else if (err.message.includes('duplicate') || err.message.includes('UNIQUE')) {
        console.log(`ℹ️  Migration "${migrationName}" already marked as applied\n`)
      } else {
        throw err
      }
    }

    // Regenerate Prisma client
    console.log('🔄 Regenerating Prisma client...')
    const { execSync } = require('child_process')
    try {
      execSync('pnpm exec prisma generate', { stdio: 'inherit' })
      console.log('✅ Prisma client regenerated successfully\n')
    } catch (err) {
      console.log('⚠️  Failed to regenerate Prisma client automatically')
      console.log('   Please run manually: pnpm exec prisma generate\n')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

markApplied()




