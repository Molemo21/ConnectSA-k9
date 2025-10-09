-- Stage 1: Create backup tables and verify
DO $$ 
BEGIN
  -- Create backup tables
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

  -- Verify backup counts
  IF (SELECT COUNT(*) FROM "services_backup") != 19 THEN
    RAISE EXCEPTION 'Expected 19 services in backup, found %', (SELECT COUNT(*) FROM "services_backup");
  END IF;

  IF (SELECT COUNT(*) FROM "reviews_backup") != 22 THEN
    RAISE EXCEPTION 'Expected 22 reviews in backup, found %', (SELECT COUNT(*) FROM "reviews_backup");
  END IF;

  IF (SELECT COUNT(*) FROM "payouts_backup") != 35 THEN
    RAISE EXCEPTION 'Expected 35 payouts in backup, found %', (SELECT COUNT(*) FROM "payouts_backup");
  END IF;

  -- Log successful backup
  RAISE NOTICE 'Successfully created backups:
    - % services
    - % provider services
    - % bookings
    - % payments
    - % payouts
    - % reviews',
    (SELECT COUNT(*) FROM "services_backup"),
    (SELECT COUNT(*) FROM "provider_services_backup"),
    (SELECT COUNT(*) FROM "bookings_backup"),
    (SELECT COUNT(*) FROM "payments_backup"),
    (SELECT COUNT(*) FROM "payouts_backup"),
    (SELECT COUNT(*) FROM "reviews_backup");
END $$;
