-- Restore in correct order to respect foreign key constraints

-- First restore services
INSERT INTO "services" 
SELECT * FROM "services_backup"
WHERE id NOT IN (SELECT id FROM "services");

-- Then restore provider_services
INSERT INTO "provider_services" 
SELECT * FROM "provider_services_backup"
WHERE id NOT IN (SELECT id FROM "provider_services");

-- Then restore bookings
INSERT INTO "bookings" 
SELECT * FROM "bookings_backup"
WHERE id NOT IN (SELECT id FROM "bookings");

-- Then restore payments
INSERT INTO "payments" 
SELECT * FROM "payments_backup"
WHERE id NOT IN (SELECT id FROM "payments");

-- Then restore payouts
INSERT INTO "payouts" 
SELECT * FROM "payouts_backup"
WHERE id NOT IN (SELECT id FROM "payouts");

-- Then restore reviews
INSERT INTO "reviews" 
SELECT * FROM "reviews_backup"
WHERE id NOT IN (SELECT id FROM "reviews");

-- Log the rollback
INSERT INTO "migration_logs" ("migration_name", "details")
SELECT 
  'rollback_remove_non_cleaning_services',
  jsonb_build_object(
    'services_restored', (SELECT COUNT(*) FROM "services_backup"),
    'provider_services_restored', (SELECT COUNT(*) FROM "provider_services_backup"),
    'bookings_restored', (SELECT COUNT(*) FROM "bookings_backup"),
    'payments_restored', (SELECT COUNT(*) FROM "payments_backup"),
    'payouts_restored', (SELECT COUNT(*) FROM "payouts_backup"),
    'reviews_restored', (SELECT COUNT(*) FROM "reviews_backup"),
    'executed_by', current_user,
    'executed_at', NOW()
  );