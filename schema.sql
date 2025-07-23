--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: BookingStatus; Type: TYPE; Schema: public; Owner: servicehub_user
--

CREATE TYPE public."BookingStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."BookingStatus" OWNER TO servicehub_user;

--
-- Name: ProviderStatus; Type: TYPE; Schema: public; Owner: servicehub_user
--

CREATE TYPE public."ProviderStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'SUSPENDED'
);


ALTER TYPE public."ProviderStatus" OWNER TO servicehub_user;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: servicehub_user
--

CREATE TYPE public."UserRole" AS ENUM (
    'CLIENT',
    'PROVIDER',
    'ADMIN'
);


ALTER TYPE public."UserRole" OWNER TO servicehub_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ProviderReview; Type: TABLE; Schema: public; Owner: servicehub_user
--

CREATE TABLE public."ProviderReview" (
    id text NOT NULL,
    "providerId" text NOT NULL,
    "adminId" text NOT NULL,
    comment text NOT NULL,
    status public."ProviderStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ProviderReview" OWNER TO servicehub_user;

--
-- Name: VerificationToken; Type: TABLE; Schema: public; Owner: servicehub_user
--

CREATE TABLE public."VerificationToken" (
    id text NOT NULL,
    "userId" text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."VerificationToken" OWNER TO servicehub_user;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: servicehub_user
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO servicehub_user;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: servicehub_user
--

CREATE TABLE public.bookings (
    id text NOT NULL,
    "clientId" text NOT NULL,
    "providerId" text NOT NULL,
    "serviceId" text NOT NULL,
    "scheduledDate" timestamp(3) without time zone NOT NULL,
    duration integer NOT NULL,
    "totalAmount" double precision NOT NULL,
    "platformFee" double precision NOT NULL,
    description text,
    address text NOT NULL,
    status public."BookingStatus" DEFAULT 'PENDING'::public."BookingStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.bookings OWNER TO servicehub_user;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: servicehub_user
--

CREATE TABLE public.payments (
    id text NOT NULL,
    "bookingId" text NOT NULL,
    amount double precision NOT NULL,
    "paystackRef" text NOT NULL,
    status text NOT NULL,
    "paidAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.payments OWNER TO servicehub_user;

--
-- Name: provider_services; Type: TABLE; Schema: public; Owner: servicehub_user
--

CREATE TABLE public.provider_services (
    id text NOT NULL,
    "providerId" text NOT NULL,
    "serviceId" text NOT NULL,
    "customRate" double precision
);


ALTER TABLE public.provider_services OWNER TO servicehub_user;

--
-- Name: providers; Type: TABLE; Schema: public; Owner: servicehub_user
--

CREATE TABLE public.providers (
    id text NOT NULL,
    "userId" text NOT NULL,
    "businessName" text,
    description text,
    experience integer,
    "hourlyRate" double precision,
    location text,
    "idDocument" text,
    "proofOfAddress" text,
    certifications text[],
    "profileImages" text[],
    status public."ProviderStatus" DEFAULT 'PENDING'::public."ProviderStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.providers OWNER TO servicehub_user;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: servicehub_user
--

CREATE TABLE public.reviews (
    id text NOT NULL,
    "bookingId" text NOT NULL,
    "providerId" text NOT NULL,
    rating integer NOT NULL,
    comment text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.reviews OWNER TO servicehub_user;

--
-- Name: services; Type: TABLE; Schema: public; Owner: servicehub_user
--

CREATE TABLE public.services (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    category text NOT NULL,
    "basePrice" double precision,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.services OWNER TO servicehub_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: servicehub_user
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    password text,
    name text NOT NULL,
    phone text,
    avatar text,
    role public."UserRole" DEFAULT 'CLIENT'::public."UserRole" NOT NULL,
    "emailVerified" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "googleId" text,
    "appleId" text
);


ALTER TABLE public.users OWNER TO servicehub_user;

--
-- Name: ProviderReview ProviderReview_pkey; Type: CONSTRAINT; Schema: public; Owner: servicehub_user
--

ALTER TABLE ONLY public."ProviderReview"
    ADD CONSTRAINT "ProviderReview_pkey" PRIMARY KEY (id);


--
-- Name: VerificationToken VerificationToken_pkey; Type: CONSTRAINT; Schema: public; Owner: servicehub_user
--

ALTER TABLE ONLY public."VerificationToken"
    ADD CONSTRAINT "VerificationToken_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: servicehub_user
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: servicehub_user
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: servicehub_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: provider_services provider_services_pkey; Type: CONSTRAINT; Schema: public; Owner: servicehub_user
--

ALTER TABLE ONLY public.provider_services
    ADD CONSTRAINT provider_services_pkey PRIMARY KEY (id);


--
-- Name: providers providers_pkey; Type: CONSTRAINT; Schema: public; Owner: servicehub_user
--

ALTER TABLE ONLY public.providers
    ADD CONSTRAINT providers_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: servicehub_user
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: servicehub_user
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: servicehub_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: VerificationToken_token_key; Type: INDEX; Schema: public; Owner: servicehub_user
--

CREATE UNIQUE INDEX "VerificationToken_token_key" ON public."VerificationToken" USING btree (token);


--
-- Name: payments_bookingId_key; Type: INDEX; Schema: public; Owner: servicehub_user
--

CREATE UNIQUE INDEX "payments_bookingId_key" ON public.payments USING btree ("bookingId");


--
-- Name: payments_paystackRef_key; Type: INDEX; Schema: public; Owner: servicehub_user
--

CREATE UNIQUE INDEX "payments_paystackRef_key" ON public.payments USING btree ("paystackRef");


--
-- Name: provider_services_providerId_serviceId_key; Type: INDEX; Schema: public; Owner: servicehub_user
--

CREATE UNIQUE INDEX "provider_services_providerId_serviceId_key" ON public.provider_services USING btree ("providerId", "serviceId");


--
-- Name: providers_userId_key; Type: INDEX; Schema: public; Owner: servicehub_user
--

CREATE UNIQUE INDEX "providers_userId_key" ON public.providers USING btree ("userId");


--
-- Name: reviews_bookingId_key; Type: INDEX; Schema: public; Owner: servicehub_user
--

CREATE UNIQUE INDEX "reviews_bookingId_key" ON public.reviews USING btree ("bookingId");


--
-- Name: users_appleId_key; Type: INDEX; Schema: public; Owner: servicehub_user
--

CREATE UNIQUE INDEX "users_appleId_key" ON public.users USING btree ("appleId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: servicehub_user
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_googleId_key; Type: INDEX; Schema: public; Owner: servicehub_user
--

CREATE UNIQUE INDEX "users_googleId_key" ON public.users USING btree ("googleId");


--
-- Name: ProviderReview ProviderReview_adminId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: servicehub_user
--

ALTER TABLE ONLY public."ProviderReview"
    ADD CONSTRAINT "ProviderReview_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProviderReview ProviderReview_providerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: servicehub_user
--

ALTER TABLE ONLY public."ProviderReview"
    ADD CONSTRAINT "ProviderReview_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES public.providers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: VerificationToken VerificationToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: servicehub_user
--

ALTER TABLE ONLY public."VerificationToken"
    ADD CONSTRAINT "VerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bookings bookings_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: servicehub_user
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "bookings_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bookings bookings_providerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: servicehub_user
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "bookings_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES public.providers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bookings bookings_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: servicehub_user
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "bookings_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public.services(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payments payments_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: servicehub_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: provider_services provider_services_providerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: servicehub_user
--

ALTER TABLE ONLY public.provider_services
    ADD CONSTRAINT "provider_services_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES public.providers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: provider_services provider_services_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: servicehub_user
--

ALTER TABLE ONLY public.provider_services
    ADD CONSTRAINT "provider_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public.services(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: providers providers_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: servicehub_user
--

ALTER TABLE ONLY public.providers
    ADD CONSTRAINT "providers_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reviews reviews_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: servicehub_user
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "reviews_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reviews reviews_providerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: servicehub_user
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "reviews_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES public.providers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO servicehub_user;


--
-- PostgreSQL database dump complete
--

