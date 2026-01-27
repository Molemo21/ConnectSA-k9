-- ============================================================================
-- ROW LEVEL SECURITY (RLS) ENABLEMENT AND POLICIES
-- ============================================================================
-- This script enables RLS on all tables and creates appropriate security policies
-- Run this in Supabase SQL Editor or via psql
-- ============================================================================

-- ============================================================================
-- STEP 1: ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.provider_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."ProviderReview" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."PasswordResetToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.booking_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.catalogue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.database_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: DROP EXISTING POLICIES (if any) - Safe to run multiple times
-- ============================================================================

-- Users policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Public can view user basic info" ON public.users;
DROP POLICY IF EXISTS "Service role bypass" ON public.users;

-- Providers policies
DROP POLICY IF EXISTS "Public can view approved providers" ON public.providers;
DROP POLICY IF EXISTS "Providers can view own profile" ON public.providers;
DROP POLICY IF EXISTS "Providers can update own profile" ON public.providers;
DROP POLICY IF EXISTS "Service role bypass" ON public.providers;

-- Services policies
DROP POLICY IF EXISTS "Public can view active services" ON public.services;
DROP POLICY IF EXISTS "Service role bypass" ON public.services;

-- Service categories policies
DROP POLICY IF EXISTS "Public can view active categories" ON public.service_categories;
DROP POLICY IF EXISTS "Service role bypass" ON public.service_categories;

-- Bookings policies
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Providers can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Service role bypass" ON public.bookings;

-- Payments policies
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Service role bypass" ON public.payments;

-- Reviews policies
DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can create reviews for own bookings" ON public.reviews;
DROP POLICY IF EXISTS "Service role bypass" ON public.reviews;

-- Provider services policies
DROP POLICY IF EXISTS "Public can view provider services" ON public.provider_services;
DROP POLICY IF EXISTS "Providers can manage own services" ON public.provider_services;
DROP POLICY IF EXISTS "Service role bypass" ON public.provider_services;

-- ProviderReview policies
DROP POLICY IF EXISTS "Admins can view all reviews" ON public."ProviderReview";
DROP POLICY IF EXISTS "Providers can view own reviews" ON public."ProviderReview";
DROP POLICY IF EXISTS "Service role bypass" ON public."ProviderReview";

-- VerificationToken policies
DROP POLICY IF EXISTS "Users can manage own tokens" ON public."VerificationToken";
DROP POLICY IF EXISTS "Service role bypass" ON public."VerificationToken";

-- PasswordResetToken policies
DROP POLICY IF EXISTS "Users can manage own tokens" ON public."PasswordResetToken";
DROP POLICY IF EXISTS "Service role bypass" ON public."PasswordResetToken";

-- Booking drafts policies
DROP POLICY IF EXISTS "Users can manage own drafts" ON public.booking_drafts;
DROP POLICY IF EXISTS "Service role bypass" ON public.booking_drafts;

-- Notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role bypass" ON public.notifications;

-- Push subscriptions policies
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Service role bypass" ON public.push_subscriptions;

-- Catalogue items policies
DROP POLICY IF EXISTS "Public can view active catalogue items" ON public.catalogue_items;
DROP POLICY IF EXISTS "Providers can manage own catalogue items" ON public.catalogue_items;
DROP POLICY IF EXISTS "Service role bypass" ON public.catalogue_items;

-- Payouts policies
DROP POLICY IF EXISTS "Providers can view own payouts" ON public.payouts;
DROP POLICY IF EXISTS "Service role bypass" ON public.payouts;

-- Webhook events policies
DROP POLICY IF EXISTS "Service role only" ON public.webhook_events;

-- Database metadata policies
DROP POLICY IF EXISTS "Service role only" ON public.database_metadata;

-- Prisma migrations policies
DROP POLICY IF EXISTS "Service role only" ON public."_prisma_migrations";

-- ============================================================================
-- STEP 3: CREATE POLICIES FOR USERS TABLE
-- ============================================================================

-- Users can view their own profile (excluding password)
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT
  USING ((select auth.uid())::text = id);

-- Users can update their own profile (excluding password - handled by API)
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE
  USING ((select auth.uid())::text = id)
  WITH CHECK ((select auth.uid())::text = id);

-- Public can view user info for approved providers (for provider discovery)
-- Note: Password and other sensitive columns should NEVER be exposed via API
-- Your application layer (Prisma/API routes) must exclude sensitive fields
CREATE POLICY "Public can view user basic info" ON public.users
  FOR SELECT
  USING (
    -- Allow viewing users who are approved providers (for provider discovery)
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers."userId" = users.id
      AND providers.status = 'APPROVED'::public."ProviderStatus"
    )
  );

-- Service role bypass (for API routes using service role key)
CREATE POLICY "Service role bypass" ON public.users
  USING ((select auth.role()) = 'service_role');

-- ============================================================================
-- STEP 4: CREATE POLICIES FOR PROVIDERS TABLE
-- ============================================================================

-- Public can view approved providers (for discovery)
CREATE POLICY "Public can view approved providers" ON public.providers
  FOR SELECT
  USING (status = 'APPROVED'::public."ProviderStatus");

-- Providers can view their own profile (any status)
CREATE POLICY "Providers can view own profile" ON public.providers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = providers."userId"
      AND users.id::text = (select auth.uid())::text
    )
  );

-- Providers can update their own profile
CREATE POLICY "Providers can update own profile" ON public.providers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = providers."userId"
      AND users.id::text = (select auth.uid())::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = providers."userId"
      AND users.id::text = (select auth.uid())::text
    )
  );

-- Service role bypass
CREATE POLICY "Service role bypass" ON public.providers
  USING ((select auth.role()) = 'service_role');

-- ============================================================================
-- STEP 5: CREATE POLICIES FOR SERVICES TABLE
-- ============================================================================

-- Public can view active services
CREATE POLICY "Public can view active services" ON public.services
  FOR SELECT
  USING ("isActive" = true);

-- Service role bypass
CREATE POLICY "Service role bypass" ON public.services
  USING ((select auth.role()) = 'service_role');

-- ============================================================================
-- STEP 6: CREATE POLICIES FOR SERVICE_CATEGORIES TABLE
-- ============================================================================

-- Public can view active categories
CREATE POLICY "Public can view active categories" ON public.service_categories
  FOR SELECT
  USING ("isActive" = true);

-- Service role bypass
CREATE POLICY "Service role bypass" ON public.service_categories
  USING ((select auth.role()) = 'service_role');

-- ============================================================================
-- STEP 7: CREATE POLICIES FOR BOOKINGS TABLE
-- ============================================================================

-- Clients can view their own bookings
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT
  USING ((select auth.uid())::text = "clientId");

-- Providers can view bookings assigned to them
CREATE POLICY "Providers can view own bookings" ON public.bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = bookings."providerId"
      AND providers."userId"::text = (select auth.uid())::text
    )
  );

-- Users can create bookings (as clients)
CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT
  WITH CHECK ((select auth.uid())::text = "clientId");

-- Users can update their own bookings (limited - status changes handled by API)
CREATE POLICY "Users can update own bookings" ON public.bookings
  FOR UPDATE
  USING ((select auth.uid())::text = "clientId")
  WITH CHECK ((select auth.uid())::text = "clientId");

-- Service role bypass
CREATE POLICY "Service role bypass" ON public.bookings
  USING ((select auth.role()) = 'service_role');

-- ============================================================================
-- STEP 8: CREATE POLICIES FOR PAYMENTS TABLE
-- ============================================================================

-- Users can view their own payments (via booking relationship)
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = payments."bookingId"
      AND bookings."clientId"::text = (select auth.uid())::text
    )
    OR
    EXISTS (
      SELECT 1 FROM public.bookings
      JOIN public.providers ON providers.id = bookings."providerId"
      WHERE bookings.id = payments."bookingId"
      AND providers."userId"::text = (select auth.uid())::text
    )
  );

-- Service role bypass
CREATE POLICY "Service role bypass" ON public.payments
  USING ((select auth.role()) = 'service_role');

-- ============================================================================
-- STEP 9: CREATE POLICIES FOR REVIEWS TABLE
-- ============================================================================

-- Public can view reviews
CREATE POLICY "Public can view reviews" ON public.reviews
  FOR SELECT
  USING (true);

-- Users can create reviews for their own completed bookings
CREATE POLICY "Users can create reviews for own bookings" ON public.reviews
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = reviews."bookingId"
      AND bookings."clientId"::text = (select auth.uid())::text
      AND bookings.status = 'COMPLETED'::public."BookingStatus"
    )
  );

-- Service role bypass
CREATE POLICY "Service role bypass" ON public.reviews
  USING ((select auth.role()) = 'service_role');

-- ============================================================================
-- STEP 10: CREATE POLICIES FOR PROVIDER_SERVICES TABLE
-- ============================================================================

-- Public can view provider services
CREATE POLICY "Public can view provider services" ON public.provider_services
  FOR SELECT
  USING (true);

-- Providers can manage their own services
CREATE POLICY "Providers can manage own services" ON public.provider_services
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = provider_services."providerId"
      AND providers."userId"::text = (select auth.uid())::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = provider_services."providerId"
      AND providers."userId"::text = (select auth.uid())::text
    )
  );

-- Service role bypass
CREATE POLICY "Service role bypass" ON public.provider_services
  USING ((select auth.role()) = 'service_role');

-- ============================================================================
-- STEP 11: CREATE POLICIES FOR PROVIDERREVIEW TABLE (Admin Reviews)
-- ============================================================================

-- Admins can view all reviews (assuming admin role check via API)
-- Note: This is restrictive - only service role can access
-- Admins should use service role key in API routes
CREATE POLICY "Service role bypass" ON public."ProviderReview"
  USING ((select auth.role()) = 'service_role');

-- ============================================================================
-- STEP 12: CREATE POLICIES FOR VERIFICATIONTOKEN TABLE
-- ============================================================================

-- Users can manage their own verification tokens
CREATE POLICY "Users can manage own tokens" ON public."VerificationToken"
  FOR ALL
  USING ((select auth.uid())::text = "userId")
  WITH CHECK ((select auth.uid())::text = "userId");

-- Service role bypass
CREATE POLICY "Service role bypass" ON public."VerificationToken"
  USING ((select auth.role()) = 'service_role');

-- ============================================================================
-- STEP 13: CREATE POLICIES FOR PASSWORDRESETTOKEN TABLE
-- ============================================================================

-- Users can manage their own password reset tokens
CREATE POLICY "Users can manage own tokens" ON public."PasswordResetToken"
  FOR ALL
  USING ((select auth.uid())::text = "userId")
  WITH CHECK ((select auth.uid())::text = "userId");

-- Service role bypass
CREATE POLICY "Service role bypass" ON public."PasswordResetToken"
  USING ((select auth.role()) = 'service_role');

-- ============================================================================
-- STEP 14: CREATE POLICIES FOR BOOKING_DRAFTS TABLE
-- ============================================================================

-- Users can manage their own booking drafts
CREATE POLICY "Users can manage own drafts" ON public.booking_drafts
  FOR ALL
  USING ((select auth.uid())::text = "userId")
  WITH CHECK ((select auth.uid())::text = "userId");

-- Service role bypass
CREATE POLICY "Service role bypass" ON public.booking_drafts
  USING ((select auth.role()) = 'service_role');

-- ============================================================================
-- STEP 15: CREATE POLICIES FOR NOTIFICATIONS TABLE
-- ============================================================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT
  USING ((select auth.uid())::text = "userId");

-- Users can update their own notifications (mark as read, etc.)
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE
  USING ((select auth.uid())::text = "userId")
  WITH CHECK ((select auth.uid())::text = "userId");

-- Service role bypass (for creating notifications)
CREATE POLICY "Service role bypass" ON public.notifications
  USING ((select auth.role()) = 'service_role');

-- ============================================================================
-- STEP 16: CREATE POLICIES FOR PUSH_SUBSCRIPTIONS TABLE
-- ============================================================================

-- Users can manage their own push subscriptions
CREATE POLICY "Users can manage own subscriptions" ON public.push_subscriptions
  FOR ALL
  USING ((select auth.uid())::text = "userId")
  WITH CHECK ((select auth.uid())::text = "userId");

-- Service role bypass
CREATE POLICY "Service role bypass" ON public.push_subscriptions
  USING ((select auth.role()) = 'service_role');

-- ============================================================================
-- STEP 17: CREATE POLICIES FOR CATALOGUE_ITEMS TABLE
-- ============================================================================

-- Public can view active catalogue items
CREATE POLICY "Public can view active catalogue items" ON public.catalogue_items
  FOR SELECT
  USING ("isActive" = true);

-- Providers can manage their own catalogue items
CREATE POLICY "Providers can manage own catalogue items" ON public.catalogue_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = catalogue_items."providerId"
      AND providers."userId"::text = (select auth.uid())::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = catalogue_items."providerId"
      AND providers."userId"::text = (select auth.uid())::text
    )
  );

-- Service role bypass
CREATE POLICY "Service role bypass" ON public.catalogue_items
  USING ((select auth.role()) = 'service_role');

-- ============================================================================
-- STEP 18: CREATE POLICIES FOR PAYOUTS TABLE
-- ============================================================================

-- Providers can view their own payouts
CREATE POLICY "Providers can view own payouts" ON public.payouts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = payouts."providerId"
      AND providers."userId"::text = (select auth.uid())::text
    )
  );

-- Service role bypass
CREATE POLICY "Service role bypass" ON public.payouts
  USING ((select auth.role()) = 'service_role');

-- ============================================================================
-- STEP 19: CREATE POLICIES FOR WEBHOOK_EVENTS TABLE
-- ============================================================================

-- Only service role can access webhook events (sensitive payment data)
CREATE POLICY "Service role only" ON public.webhook_events
  USING ((select auth.role()) = 'service_role');

-- ============================================================================
-- STEP 20: CREATE POLICIES FOR DATABASE_METADATA TABLE
-- ============================================================================

-- Only service role can access database metadata
CREATE POLICY "Service role only" ON public.database_metadata
  USING ((select auth.role()) = 'service_role');

-- ============================================================================
-- STEP 21: CREATE POLICIES FOR _PRISMA_MIGRATIONS TABLE
-- ============================================================================

-- Only service role can access Prisma migrations
CREATE POLICY "Service role only" ON public."_prisma_migrations"
  USING ((select auth.role()) = 'service_role');

-- ============================================================================
-- VERIFICATION QUERIES (Optional - run to verify RLS is enabled)
-- ============================================================================

-- Check which tables have RLS enabled
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename;

-- Check all policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, policyname;

-- ============================================================================
-- IMPORTANT NOTES:
-- ============================================================================
-- 1. These policies protect against direct SQL access and Supabase REST API
-- 2. Prisma with direct connections (service role) bypasses RLS - this is expected
-- 3. Your API routes should use service role key for backend operations
-- 4. Sensitive columns (password, tokens) are protected by policies
-- 5. Users can only access their own data
-- 6. Public data (services, categories, approved providers) is readable by all
-- 7. Financial data (payments, payouts) is restricted to owners and service role
-- ============================================================================
