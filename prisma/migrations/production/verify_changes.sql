-- Check service counts
SELECT 
  'Service Counts' as check_name,
  COUNT(*) as total_services,
  COUNT(*) FILTER (WHERE category = 'CLEANING') as cleaning_services,
  COUNT(*) FILTER (WHERE category != 'CLEANING') as other_services
FROM "services";

-- Check for orphaned records
SELECT 
  'Orphaned Records' as check_name,
  COUNT(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM "services" s WHERE s.id = ps."serviceId")) as orphaned_provider_services,
  COUNT(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM "services" s WHERE s.id = b."serviceId")) as orphaned_bookings
FROM "provider_services" ps
CROSS JOIN "bookings" b;

-- Check service categories
SELECT 
  'Service Categories' as check_name,
  category,
  COUNT(*) as count
FROM "services"
GROUP BY category;

-- Check service details
SELECT 
  'Service Details' as check_name,
  name,
  category,
  "mainCategory",
  "basePrice",
  duration,
  features,
  "isActive"
FROM "services"
ORDER BY name;
