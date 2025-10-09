-- First, backup all the tables we're going to modify
CREATE TABLE IF NOT EXISTS "services_backup" AS 
SELECT * FROM "services" WHERE category NOT IN ('cleaning');

CREATE TABLE IF NOT EXISTS "provider_services_backup" AS 
SELECT ps.* FROM "provider_services" ps
JOIN "services" s ON s.id = ps."serviceId"
WHERE s.category NOT IN ('cleaning');

CREATE TABLE IF NOT EXISTS "bookings_backup" AS 
SELECT b.* FROM "bookings" b
JOIN "services" s ON s.id = b."serviceId"
WHERE s.category NOT IN ('cleaning');

CREATE TABLE IF NOT EXISTS "payments_backup" AS 
SELECT p.* FROM "payments" p
JOIN "bookings" b ON b.id = p."bookingId"
JOIN "services" s ON s.id = b."serviceId"
WHERE s.category NOT IN ('cleaning');

CREATE TABLE IF NOT EXISTS "payouts_backup" AS 
SELECT po.* FROM "payouts" po
JOIN "payments" p ON p.id = po."paymentId"
JOIN "bookings" b ON b.id = p."bookingId"
JOIN "services" s ON s.id = b."serviceId"
WHERE s.category NOT IN ('cleaning');

CREATE TABLE IF NOT EXISTS "reviews_backup" AS 
SELECT r.* FROM "reviews" r
JOIN "bookings" b ON b.id = r."bookingId"
JOIN "services" s ON s.id = b."serviceId"
WHERE s.category NOT IN ('cleaning');

-- Delete in correct order to respect foreign key constraints
-- First delete payouts
DELETE FROM "payouts" 
WHERE "paymentId" IN (
  SELECT p.id FROM "payments" p
  JOIN "bookings" b ON b.id = p."bookingId"
  JOIN "services" s ON s.id = b."serviceId"
  WHERE s.category NOT IN ('cleaning')
);

-- Then delete reviews
DELETE FROM "reviews"
WHERE "bookingId" IN (
  SELECT b.id FROM "bookings" b
  JOIN "services" s ON s.id = b."serviceId"
  WHERE s.category NOT IN ('cleaning')
);

-- Then delete payments
DELETE FROM "payments" 
WHERE "bookingId" IN (
  SELECT b.id FROM "bookings" b
  JOIN "services" s ON s.id = b."serviceId"
  WHERE s.category NOT IN ('cleaning')
);

-- Then delete bookings
DELETE FROM "bookings" 
WHERE "serviceId" IN (
  SELECT id FROM "services" 
  WHERE category NOT IN ('cleaning')
);

-- Then delete provider services
DELETE FROM "provider_services" 
WHERE "serviceId" IN (
  SELECT id FROM "services" 
  WHERE category NOT IN ('cleaning')
);

-- Finally remove the services
DELETE FROM "services" WHERE category NOT IN ('cleaning');

-- Update the services table to ensure all cleaning services have correct categories
UPDATE "services"
SET 
  "mainCategory" = 'HOME_SERVICES',
  category = 'CLEANING'
WHERE category = 'cleaning';

-- Insert missing cleaning services if they don't exist
INSERT INTO "services" ("id", "name", "description", "mainCategory", "category", "basePrice", "duration", "features", "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(), -- Generate UUID for id
  name,
  description,
  'HOME_SERVICES',
  'CLEANING',
  "basePrice",
  60,
  ARRAY['Professional service', 'Quality guarantee', 'Experienced providers', 'Customer satisfaction'],
  true,
  NOW(),
  NOW()
FROM (VALUES
  ('House Cleaning', 'Professional house cleaning services including dusting, vacuuming, and sanitizing', 350.00),
  ('Window Cleaning', 'Interior and exterior window cleaning services', 300.00),
  ('Deep Cleaning', 'Comprehensive deep cleaning for move-in/move-out or special occasions', 600.00),
  ('Carpet Cleaning', 'Professional carpet and upholstery cleaning services', 400.00)
) AS new_services(name, description, "basePrice")
WHERE NOT EXISTS (
  SELECT 1 FROM "services" WHERE "services".name = new_services.name
);

-- Create a log of what was done
CREATE TABLE IF NOT EXISTS "migration_logs" (
  "id" SERIAL PRIMARY KEY,
  "migration_name" TEXT,
  "executed_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "details" JSONB
);

INSERT INTO "migration_logs" ("migration_name", "details")
SELECT 
  'remove_non_cleaning_services',
  jsonb_build_object(
    'services_removed', (SELECT COUNT(*) FROM "services_backup"),
    'payouts_removed', (SELECT COUNT(*) FROM "payouts_backup"),
    'payments_removed', (SELECT COUNT(*) FROM "payments_backup"),
    'reviews_removed', (SELECT COUNT(*) FROM "reviews_backup"),
    'bookings_removed', (SELECT COUNT(*) FROM "bookings_backup"),
    'provider_services_removed', (SELECT COUNT(*) FROM "provider_services_backup"),
    'cleaning_services_count', (SELECT COUNT(*) FROM "services" WHERE category = 'CLEANING'),
    'executed_by', current_user,
    'executed_at', NOW()
  );