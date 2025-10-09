/* Stage 6: Final Verification of Services and Bookings */
DO $$
DECLARE
    service_count INT;
    active_service_count INT;
    cleaning_service_count INT;
    provider_service_count INT;
    booking_count INT;
    payment_count INT;
    review_count INT;
    provider_count INT;
    active_provider_count INT;
BEGIN
    RAISE NOTICE '--- Starting Final Verification ---';

    -- 1. Verify Services
    SELECT COUNT(*) INTO service_count FROM "services";
    SELECT COUNT(*) INTO active_service_count FROM "services" WHERE "isActive" = true;
    SELECT COUNT(*) INTO cleaning_service_count FROM "services" WHERE category = 'CLEANING';

    RAISE NOTICE 'Services Summary:';
    RAISE NOTICE '- Total services: %', service_count;
    RAISE NOTICE '- Active services: %', active_service_count;
    RAISE NOTICE '- Cleaning services: %', cleaning_service_count;

    -- 2. Verify Categories
    RAISE NOTICE E'\nService Categories:';
    WITH category_counts AS (
        SELECT category, COUNT(*) as count
        FROM "services"
        GROUP BY category
    )
    SELECT format('- %s: %s services', category, count)
    FROM category_counts;

    -- 3. Verify Service Details
    RAISE NOTICE E'\nCleaning Services Details:';
    SELECT 
        format('- %s (R%.2f)', name, "basePrice")
    FROM "services"
    WHERE category = 'CLEANING'
    ORDER BY name;

    -- 4. Verify Provider Services
    SELECT COUNT(*) INTO provider_service_count FROM "provider_services";
    RAISE NOTICE E'\nProvider Services:';
    RAISE NOTICE '- Total provider-service links: %', provider_service_count;

    -- 5. Verify Providers
    SELECT COUNT(*) INTO provider_count FROM "providers";
    SELECT COUNT(*) INTO active_provider_count 
    FROM "providers" 
    WHERE status = 'APPROVED' AND available = true;

    RAISE NOTICE E'\nProviders Summary:';
    RAISE NOTICE '- Total providers: %', provider_count;
    RAISE NOTICE '- Active providers: %', active_provider_count;

    -- 6. Verify Bookings
    SELECT COUNT(*) INTO booking_count FROM "bookings";
    SELECT COUNT(*) INTO payment_count FROM "payments";
    SELECT COUNT(*) INTO review_count FROM "reviews";

    RAISE NOTICE E'\nBookings Summary:';
    RAISE NOTICE '- Total bookings: %', booking_count;
    RAISE NOTICE '- Total payments: %', payment_count;
    RAISE NOTICE '- Total reviews: %', review_count;

    -- 7. Verify Booking Status Distribution
    RAISE NOTICE E'\nBooking Status Distribution:';
    WITH booking_status_counts AS (
        SELECT status, COUNT(*) as count
        FROM "bookings"
        GROUP BY status
    )
    SELECT format('- %s: %s bookings', status, count)
    FROM booking_status_counts;

    -- 8. Verify Data Integrity
    RAISE NOTICE E'\nData Integrity Checks:';

    -- Check for orphaned bookings (no service)
    WITH orphaned_bookings AS (
        SELECT COUNT(*) as count
        FROM "bookings" b
        LEFT JOIN "services" s ON b."serviceId" = s.id
        WHERE s.id IS NULL
    )
    SELECT 
        CASE 
            WHEN count > 0 THEN format('❌ Found % orphaned bookings', count)
            ELSE '✓ No orphaned bookings found'
        END
    FROM orphaned_bookings;

    -- Check for orphaned provider services
    WITH orphaned_provider_services AS (
        SELECT COUNT(*) as count
        FROM "provider_services" ps
        LEFT JOIN "services" s ON ps."serviceId" = s.id
        WHERE s.id IS NULL
    )
    SELECT 
        CASE 
            WHEN count > 0 THEN format('❌ Found % orphaned provider services', count)
            ELSE '✓ No orphaned provider services found'
        END
    FROM orphaned_provider_services;

    -- Check for orphaned payments
    WITH orphaned_payments AS (
        SELECT COUNT(*) as count
        FROM "payments" p
        LEFT JOIN "bookings" b ON p."bookingId" = b.id
        WHERE b.id IS NULL
    )
    SELECT 
        CASE 
            WHEN count > 0 THEN format('❌ Found % orphaned payments', count)
            ELSE '✓ No orphaned payments found'
        END
    FROM orphaned_payments;

    -- Check for orphaned reviews
    WITH orphaned_reviews AS (
        SELECT COUNT(*) as count
        FROM "reviews" r
        LEFT JOIN "bookings" b ON r."bookingId" = b.id
        WHERE b.id IS NULL
    )
    SELECT 
        CASE 
            WHEN count > 0 THEN format('❌ Found % orphaned reviews', count)
            ELSE '✓ No orphaned reviews found'
        END
    FROM orphaned_reviews;

    -- 9. Verify Expected Services
    RAISE NOTICE E'\nVerifying Expected Services:';
    
    CREATE TEMP TABLE expected_services (
        name TEXT,
        category TEXT,
        base_price DECIMAL
    );

    -- Insert expected cleaning services
    INSERT INTO expected_services VALUES
        ('Cleaning Services', 'CLEANING', 150.00),
        ('House Cleaning', 'CLEANING', 350.00),
        ('Window Cleaning', 'CLEANING', 300.00),
        ('Deep Cleaning', 'CLEANING', 600.00),
        ('Carpet Cleaning', 'CLEANING', 400.00);

    -- Compare with actual services
    WITH service_comparison AS (
        SELECT 
            e.name,
            CASE 
                WHEN s.id IS NULL THEN 'Missing'
                WHEN s.category != e.category THEN 'Wrong category'
                WHEN ABS(s."basePrice" - e.base_price) > 0.01 THEN 'Price mismatch'
                ELSE 'OK'
            END as status
        FROM expected_services e
        LEFT JOIN "services" s ON e.name = s.name
    )
    SELECT 
        CASE 
            WHEN status = 'OK' THEN format('✓ %s: Verified', name)
            ELSE format('❌ %s: %s', name, status)
        END
    FROM service_comparison;

    -- Clean up
    DROP TABLE IF EXISTS expected_services;

    RAISE NOTICE E'\n--- Verification Complete ---';
END $$;
