/* Create a temporary table to store our results */
CREATE TEMP TABLE IF NOT EXISTS service_update_results (
    step TEXT,
    count INTEGER,
    executed_at TIMESTAMP DEFAULT NOW()
);

DO $$
DECLARE
  updated_count INTEGER := 0;
  inserted_count INTEGER := 0;
BEGIN
  /* Update existing cleaning services */
  WITH updated_services AS (
    UPDATE "services"
    SET 
      category = 'CLEANING'
    WHERE category = 'cleaning'
    RETURNING *
  )
  SELECT COUNT(*) INTO updated_count FROM updated_services;

  /* Insert missing cleaning services */
  WITH new_services AS (
    INSERT INTO "services" (
      "id", 
      "name", 
      "description", 
      "category", 
      "basePrice", 
      "isActive", 
      "createdAt", 
      "updatedAt"
    )
    SELECT 
      gen_random_uuid(),
      name,
      description,
      'CLEANING',
      "basePrice",
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
    )
    RETURNING *
  )
  SELECT COUNT(*) INTO inserted_count FROM new_services;

  /* Store results */
  INSERT INTO service_update_results (step, count) VALUES
    ('Updated existing services', updated_count),
    ('Inserted new services', inserted_count);

END $$;

/* Show the results of our updates */
SELECT step, count FROM service_update_results ORDER BY executed_at;

/* Show current services */
SELECT 
    name,
    category,
    "basePrice",
    "isActive",
    "createdAt"
FROM services
ORDER BY name;