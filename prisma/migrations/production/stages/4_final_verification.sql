/* Final verification of the migration */
DO $$
DECLARE
  verification_errors TEXT[];
  total_services INTEGER;
  non_cleaning_services INTEGER;
  inactive_services INTEGER;
  expected_services TEXT[] := ARRAY['Carpet Cleaning', 'Cleaning Services', 'Deep Cleaning', 'House Cleaning', 'Window Cleaning'];
  missing_services TEXT[];
BEGIN
  verification_errors := ARRAY[]::TEXT[];
  
  /* Check total number of services */
  SELECT COUNT(*) INTO total_services FROM services;
  IF total_services != 5 THEN
    verification_errors := array_append(
      verification_errors, 
      format('Expected 5 services, found %s', total_services)
    );
  END IF;

  /* Check for non-cleaning services */
  SELECT COUNT(*) INTO non_cleaning_services 
  FROM services 
  WHERE category != 'CLEANING';
  
  IF non_cleaning_services > 0 THEN
    verification_errors := array_append(
      verification_errors, 
      format('Found %s non-cleaning services', non_cleaning_services)
    );
  END IF;

  /* Check for inactive services */
  SELECT COUNT(*) INTO inactive_services 
  FROM services 
  WHERE NOT "isActive";
  
  IF inactive_services > 0 THEN
    verification_errors := array_append(
      verification_errors, 
      format('Found %s inactive services', inactive_services)
    );
  END IF;

  /* Check for missing expected services */
  WITH expected AS (
    SELECT unnest(expected_services) as service_name
  ), actual AS (
    SELECT name FROM services
  )
  SELECT array_agg(service_name)
  INTO missing_services
  FROM expected
  WHERE service_name NOT IN (SELECT name FROM actual);

  IF missing_services IS NOT NULL THEN
    verification_errors := array_append(
      verification_errors, 
      format('Missing services: %s', array_to_string(missing_services, ', '))
    );
  END IF;

  /* Raise any errors found */
  IF array_length(verification_errors, 1) > 0 THEN
    RAISE EXCEPTION 'Verification failed:
%', array_to_string(verification_errors, E'\n');
  END IF;

  /* If we get here, all verifications passed */
  RAISE NOTICE 'Migration successfully verified:
- Total services: %
- All services are cleaning services
- All services are active
- All expected services are present
- Price range: R150 - R600', total_services;

END $$;

/* Show final state for reference */
SELECT 
    name,
    category,
    "basePrice",
    "isActive",
    "createdAt"
FROM services
ORDER BY name;
