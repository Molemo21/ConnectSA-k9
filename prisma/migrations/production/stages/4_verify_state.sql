-- Stage 4: Verify final state
DO $$
DECLARE
  cleaning_services_count INTEGER;
  total_services_count INTEGER;
  verification_errors TEXT[];
BEGIN
  -- Initialize error array
  verification_errors := ARRAY[]::TEXT[];

  -- Check service counts
  SELECT COUNT(*) INTO cleaning_services_count FROM "services" WHERE category = 'CLEANING';
  SELECT COUNT(*) INTO total_services_count FROM "services";
  
  -- Verify only cleaning services remain
  IF cleaning_services_count != total_services_count THEN
    verification_errors := array_append(
      verification_errors, 
      format('Found non-cleaning services: %s total services, %s cleaning services', 
        total_services_count, cleaning_services_count)
    );
  END IF;

  -- Verify we have services
  IF cleaning_services_count < 1 THEN
    verification_errors := array_append(
      verification_errors,
      'No cleaning services found after migration'
    );
  END IF;

  -- Verify no orphaned records
  IF EXISTS (
    SELECT 1 FROM "bookings" b
    LEFT JOIN "services" s ON s.id = b."serviceId"
    WHERE s.id IS NULL
  ) THEN
    verification_errors := array_append(
      verification_errors,
      'Found orphaned bookings'
    );
  END IF;

  -- Raise any errors found
  IF array_length(verification_errors, 1) > 0 THEN
    RAISE EXCEPTION 'Verification failed:
%', array_to_string(verification_errors, E'\n');
  END IF;

  -- Log success
  RAISE NOTICE 'Verification successful:
    - % total services
    - All services are cleaning services
    - No orphaned records found',
    total_services_count;
END $$;

-- Create final migration log
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
