#!/usr/bin/env node
/**
 * Verify that push_subscriptions table exists and is properly structured
 * Run: node scripts/verify-push-subscriptions-table.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function verify() {
  try {
    console.log('🔍 Verifying push_subscriptions table...\n')

    // Check if table exists
    const tableCheck = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'push_subscriptions'
    `

    if (tableCheck.length === 0) {
      console.log('❌ Table "push_subscriptions" does not exist!')
      console.log('📝 Run the SQL from migrations/manual-add-push-subscriptions.sql\n')
      process.exit(1)
    }

    console.log('✅ Table "push_subscriptions" exists')

    // Check columns
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'push_subscriptions'
      ORDER BY ordinal_position
    `

    console.log('\n📋 Table structure:')
    console.table(columns)

    // Check indexes
    const indexes = await prisma.$queryRaw`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'push_subscriptions'
    `

    console.log('\n🔑 Indexes:')
    console.table(indexes)

    // Check foreign key
    const fk = await prisma.$queryRaw`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'push_subscriptions'
    `

    console.log('\n🔗 Foreign Keys:')
    console.table(fk)

    // Try to query the table (tests Prisma client generation)
    try {
      const count = await prisma.pushSubscription.count()
      console.log(`\n✅ Prisma client working! Current subscriptions: ${count}`)
    } catch (err) {
      console.log('\n⚠️  Table exists but Prisma client needs regeneration:')
      console.log('   Run: pnpm exec prisma generate\n')
      console.log('   Error:', err.message)
    }

    console.log('\n✅ All checks passed!\n')
  } catch (error) {
    console.error('❌ Verification failed:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verify()




