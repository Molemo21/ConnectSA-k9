/* Stage 2: Remove related records in correct order */

/* Create a temporary table to store our results */
CREATE TEMP TABLE IF NOT EXISTS deletion_results (
    step TEXT,
    records_deleted INTEGER,
    executed_at TIMESTAMP DEFAULT NOW()
);

DO $$
DECLARE
  payouts_count INTEGER := 0;
  reviews_count INTEGER := 0;
  payments_count INTEGER := 0;
  bookings_count INTEGER := 0;
  provider_services_count INTEGER := 0;
  services_count INTEGER := 0;
BEGIN
  /* First delete payouts */
  WITH deleted_payouts AS (
    DELETE FROM "payouts" 
    WHERE "paymentId" IN (
      SELECT p.id FROM "payments" p
      JOIN "bookings" b ON b.id = p."bookingId"
      JOIN "services" s ON s.id = b."serviceId"
      WHERE s.category NOT IN ('cleaning')
    )
    RETURNING *
  )
  SELECT COUNT(*) INTO payouts_count FROM deleted_payouts;

  /* Then delete reviews */
  WITH deleted_reviews AS (
    DELETE FROM "reviews"
    WHERE "bookingId" IN (
      SELECT b.id FROM "bookings" b
      JOIN "services" s ON s.id = b."serviceId"
      WHERE s.category NOT IN ('cleaning')
    )
    RETURNING *
  )
  SELECT COUNT(*) INTO reviews_count FROM deleted_reviews;

  /* Then delete payments */
  WITH deleted_payments AS (
    DELETE FROM "payments" 
    WHERE "bookingId" IN (
      SELECT b.id FROM "bookings" b
      JOIN "services" s ON s.id = b."serviceId"
      WHERE s.category NOT IN ('cleaning')
    )
    RETURNING *
  )
  SELECT COUNT(*) INTO payments_count FROM deleted_payments;

  /* Then delete bookings */
  WITH deleted_bookings AS (
    DELETE FROM "bookings" 
    WHERE "serviceId" IN (
      SELECT id FROM "services" 
      WHERE category NOT IN ('cleaning')
    )
    RETURNING *
  )
  SELECT COUNT(*) INTO bookings_count FROM deleted_bookings;

  /* Then delete provider services */
  WITH deleted_provider_services AS (
    DELETE FROM "provider_services" 
    WHERE "serviceId" IN (
      SELECT id FROM "services" 
      WHERE category NOT IN ('cleaning')
    )
    RETURNING *
  )
  SELECT COUNT(*) INTO provider_services_count FROM deleted_provider_services;

  /* Finally remove the services */
  WITH deleted_services AS (
    DELETE FROM "services" 
    WHERE category NOT IN ('cleaning')
    RETURNING *
  )
  SELECT COUNT(*) INTO services_count FROM deleted_services;

  /* Store results in our temporary table */
  INSERT INTO deletion_results (step, records_deleted) VALUES
    ('Payouts', payouts_count),
    ('Reviews', reviews_count),
    ('Payments', payments_count),
    ('Bookings', bookings_count),
    ('Provider Services', provider_services_count),
    ('Services', services_count);

END $$;

/* Show the results */
SELECT 
    step,
    records_deleted,
    CASE 
        WHEN step = 'Payouts' AND records_deleted != 35 THEN 'Expected 35'
        WHEN step = 'Reviews' AND records_deleted != 22 THEN 'Expected 22'
        WHEN step = 'Services' AND records_deleted != 19 THEN 'Expected 19'
        ELSE 'OK'
    END as status
FROM deletion_results
ORDER BY executed_at;

/* Show remaining services */
SELECT 
    category,
    COUNT(*) as remaining_services
FROM services
GROUP BY category;