#!/usr/bin/env node

/*
 * One-click DB repair for PaymentStatus enum and payments.status column
 * - Uses DIRECT_URL if available (preferred), otherwise DATABASE_URL
 * - Idempotent: safe to re-run
 */

const { Client } = require('pg')

async function run() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL
  if (!connectionString) {
    console.error('❌ DIRECT_URL (preferred) or DATABASE_URL must be set in the environment')
    process.exit(1)
  }

  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('🔌 Connected to database')

    // Ensure enum exists
    console.log('🔍 Ensuring PaymentStatus enum exists...')
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
          CREATE TYPE "PaymentStatus" AS ENUM (
            'PENDING','ESCROW','HELD_IN_ESCROW','PROCESSING_RELEASE','RELEASED','COMPLETED','REFUNDED','FAILED'
          );
        END IF;
      END $$;
    `)

    // Add any missing enum values
    const values = ['PENDING','ESCROW','HELD_IN_ESCROW','PROCESSING_RELEASE','RELEASED','COMPLETED','REFUNDED','FAILED']
    for (const v of values) {
      await client.query(`ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS '${v}';`)
    }
    console.log('✅ PaymentStatus enum ensured')

    // Check current column type
    console.log('🔍 Checking payments.status column...')
    const { rows } = await client.query(`
      SELECT data_type, udt_name
      FROM information_schema.columns 
      WHERE table_name = 'payments' AND column_name = 'status'
    `)
    if (rows.length === 0) {
      console.error('❌ payments.status column not found')
      process.exit(1)
    }

    const currentUdt = rows[0].udt_name
    console.log(`📊 Current payments.status type: ${currentUdt}`)

    // Normalize existing values to valid enums before type change
    console.log('🧹 Normalizing existing payments.status values...')
    await client.query(`
      UPDATE "payments" 
      SET status = CASE 
        WHEN status IN ('pending','PENDING') THEN 'PENDING'
        WHEN status IN ('escrow','ESCROW') THEN 'ESCROW'
        WHEN status IN ('held_in_escrow','HELD_IN_ESCROW') THEN 'HELD_IN_ESCROW'
        WHEN status IN ('processing_release','PROCESSING_RELEASE') THEN 'PROCESSING_RELEASE'
        WHEN status IN ('released','RELEASED') THEN 'RELEASED'
        WHEN status IN ('completed','COMPLETED','paid','PAID') THEN 'ESCROW'
        WHEN status IN ('refunded','REFUNDED') THEN 'REFUNDED'
        WHEN status IN ('failed','FAILED') THEN 'FAILED'
        ELSE 'PENDING'
      END
    `)
    console.log('✅ Existing values normalized')

    if (currentUdt !== 'PaymentStatus') {
      console.log('🔁 Converting payments.status column to PaymentStatus enum...')
      await client.query('BEGIN')
      try {
        await client.query(`
          ALTER TABLE "payments" 
          ALTER COLUMN status TYPE "PaymentStatus" USING status::"PaymentStatus";
        `)
        await client.query('COMMIT')
        console.log('✅ Column converted to PaymentStatus enum')
      } catch (e) {
        await client.query('ROLLBACK')
        throw e
      }
    } else {
      console.log('ℹ️ Column already uses PaymentStatus enum')
    }

    console.log('🎉 Repair complete')
  } catch (err) {
    console.error('❌ Repair failed:', err.message)
    process.exit(1)
  } finally {
    try { await client.end() } catch {}
  }
}

run()


