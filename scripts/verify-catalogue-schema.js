#!/usr/bin/env node
/**
 * Verify Catalogue/Booking Schema Sync
 * - Checks required tables/columns
 * - Verifies FKs and basic counts
 * - Safe to run against current DATABASE_URL
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({ log: ['warn', 'error'] });

async function columnExists(table, column) {
  const rows = await prisma.$queryRaw`
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${table} AND column_name = ${column}
  `;
  return rows.length > 0;
}

async function tableExists(table) {
  const rows = await prisma.$queryRaw`
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = ${table}
  `;
  return rows.length > 0;
}

async function verify() {
  console.log('🔍 Verifying schema for Catalogue Pricing...');
  console.log('DB URL present:', !!process.env.DATABASE_URL);

  // Tables
  const hasCatalogueItems = await tableExists('catalogue_items');
  const hasBookings = await tableExists('bookings');
  console.log(`📦 catalogue_items table: ${hasCatalogueItems ? '✅' : '❌'}`);
  console.log(`🧾 bookings table: ${hasBookings ? '✅' : '❌'}`);

  // catalogue_items columns
  if (hasCatalogueItems) {
    const requiredCatalogueColumns = [
      'id','providerId','serviceId','title','shortDesc','longDesc','price','currency','durationMins','images','isActive','createdAt','updatedAt'
    ];
    const results = await Promise.all(requiredCatalogueColumns.map(c => columnExists('catalogue_items', c)));
    const missing = requiredCatalogueColumns.filter((_, i) => !results[i]);
    console.log(`📋 catalogue_items columns OK: ${missing.length === 0 ? '✅' : '❌ missing -> ' + missing.join(', ')}`);
  }

  // bookings snapshot columns
  if (hasBookings) {
    const bookingColumns = ['catalogueItemId','bookedPrice','bookedCurrency','bookedDurationMins'];
    const results = await Promise.all(bookingColumns.map(c => columnExists('bookings', c)));
    const missing = bookingColumns.filter((_, i) => !results[i]);
    console.log(`📋 bookings snapshot columns OK: ${missing.length === 0 ? '✅' : '❌ missing -> ' + missing.join(', ')}`);
  }

  // Row counts
  if (hasCatalogueItems) {
    const [{ count: totalItems }] = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM "public"."catalogue_items"`;
    const [{ count: activeItems }] = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM "public"."catalogue_items" WHERE "isActive" = true`;
    console.log(`📊 catalogue_items: total=${totalItems}, active=${activeItems}`);
  }
  if (hasBookings) {
    const [{ count: snapBookings }] = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count FROM "public"."bookings" WHERE "catalogueItemId" IS NOT NULL`;
    console.log(`📊 bookings with catalogueItemId: ${snapBookings}`);
  }

  // FK integrity
  if (hasCatalogueItems) {
    const [{ count: orphansProv }] = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count
      FROM "public"."catalogue_items" ci LEFT JOIN "public"."providers" p ON p."id" = ci."providerId"
      WHERE p."id" IS NULL`;
    const [{ count: orphansSvc }] = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count
      FROM "public"."catalogue_items" ci LEFT JOIN "public"."services" s ON s."id" = ci."serviceId"
      WHERE s."id" IS NULL`;
    console.log(`🔗 FK check: providerId orphans=${orphansProv}, serviceId orphans=${orphansSvc}`);
  }
  if (hasBookings) {
    const [{ count: orphansBooking }] = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count
      FROM "public"."bookings" b LEFT JOIN "public"."catalogue_items" ci ON ci."id" = b."catalogueItemId"
      WHERE b."catalogueItemId" IS NOT NULL AND ci."id" IS NULL`;
    console.log(`🔗 FK check: bookings.catalogueItemId orphans=${orphansBooking}`);
  }

  await prisma.$disconnect();
  console.log('✅ Verification complete');
}

verify().catch(async (e) => {
  console.error('❌ Verification failed:', e);
  try { await prisma.$disconnect(); } catch {}
  process.exit(1);
});


