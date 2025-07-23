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
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: servicehub_user
--

INSERT INTO public.users VALUES ('cmd8qkcrm0005s7v4ulmum6q6', 'aphiwegaya12@gmaol.com', '$2b$12$w1YS3ZNBqBf9MWGqayNqzuaoFlcsorZMqn1LndxqHbJEM3bZ5vMUK', 'Aphiwe Gaya', '+27725393763', NULL, 'CLIENT', true, true, '2025-07-18 11:28:49.569', '2025-07-18 11:49:32.613', NULL, NULL);
INSERT INTO public.users VALUES ('cmd8rf5d20000s76s68cm3ni3', 'lesegoramarwanekb@gmail.com', '$2b$12$5KL.KzdHj0HjTR.RMLKfP.p9agwLGNclKdwEaAIiXc5R0cz.rVMTC', 'Lesego Martha Ramarwane', '+27687683123', NULL, 'PROVIDER', true, true, '2025-07-18 11:52:46.293', '2025-07-18 11:53:13.342', NULL, NULL);
INSERT INTO public.users VALUES ('cmd8rgzmu0005s76svcxk5pxi', 'molemonakin10@gmail.com', '$2b$12$eu/tzWCEm52TmcLyopboVOQ.ybJDGOoBmIY0tD5k5KvFZcr3m51Su', 'Molemo Nakin', '+27731475722', NULL, 'PROVIDER', true, true, '2025-07-18 11:54:12.198', '2025-07-18 11:56:01.34', NULL, NULL);
INSERT INTO public.users VALUES ('cmd8luf470000s7v4r63i74sw', 'bubelembizeni32@gmail.com', '$2b$12$kFqsZFvFxUiU2wgEUj8Wp.A0JMnd57wd/NvzlqUHF9IFU2qr2rMEW', 'Keitumetse Faith Seroto', '+27687683123', NULL, 'PROVIDER', true, true, '2025-07-18 09:16:41.092', '2025-07-18 12:11:43.595', NULL, NULL);
INSERT INTO public.users VALUES ('cmd8s54gr000cs76szc8gioxr', 'thabangnakin17@gmail.com', '$2b$12$9/Sox7sd0OX9.Ldl.DrMYusGQnFx5DyAuROvBP0m3IDuJHDqoLyLe', 'Thabang Nakin', '0834424777', NULL, 'PROVIDER', true, true, '2025-07-18 12:12:58.204', '2025-07-18 12:13:23.827', NULL, NULL);
INSERT INTO public.users VALUES ('cmd8kloy60000s7s4a2w0nmfc', 'molemonakin21@gmail.com', '$2b$12$d/OkG0q6H1kwRyTwkolqBe4F2fiOuREUzSHSbHIj3A0Ob2tV9BlJm', 'Molemo Nakin', '+27738841913', NULL, 'CLIENT', true, true, '2025-07-18 08:41:54.319', '2025-07-21 09:30:06.298', NULL, NULL);
INSERT INTO public.users VALUES ('cmdd0znn80002s7fw3h7cg2np', 'molemonakin2016@gmail.com', '$2b$12$ZCWSsbZXD0cx1IQh9PemEOaRrjNglQyqtQhEIeiw9Xk8SoYckI7SG', 'Benard Nakin', '+27731475722', NULL, 'CLIENT', true, true, '2025-07-21 11:31:44.371', '2025-07-21 11:41:52.208', NULL, NULL);
INSERT INTO public.users VALUES ('cmdd3uxl00000s73kerzcadcc', 'admin@example.com', '$2b$12$icY548LkXbwe3ccHvLUIYOsonrIpTr8bi/QsZng0hQ44/IBUZQuSe', 'Admin User', NULL, NULL, 'ADMIN', true, true, '2025-07-21 12:52:02.819', '2025-07-21 12:52:02.819', NULL, NULL);
INSERT INTO public.users VALUES ('cmdea8gv00000s7l0bag3fl01', 'nontlahlaadonis6@gmail.com', '$2b$12$Is5jCaJ4rauWmWfQDBtDueX0rRX7Dj1KPXQ3eD1sEhH963nudGdnq', 'Dodo Adonis', '+27738783918', NULL, 'PROVIDER', true, true, '2025-07-22 08:38:18.205', '2025-07-22 08:38:41.831', NULL, NULL);


--
-- Data for Name: providers; Type: TABLE DATA; Schema: public; Owner: servicehub_user
--

INSERT INTO public.providers VALUES ('cmd8s54gx000es76s21z7l5r1', 'cmd8s54gr000cs76szc8gioxr', 'John''s services', 'expert in cleaning', 7, 150, 'Mthatha', NULL, NULL, NULL, NULL, 'APPROVED', '2025-07-18 12:12:58.209', '2025-07-21 19:44:32.978');
INSERT INTO public.providers VALUES ('cmd8rgzn20007s76sn04a3c0m', 'cmd8rgzmu0005s76svcxk5pxi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'REJECTED', '2025-07-18 11:54:12.207', '2025-07-21 19:44:43.403');
INSERT INTO public.providers VALUES ('cmd8rf5dt0002s76s7mqas1ap', 'cmd8rf5d20000s76s68cm3ni3', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'REJECTED', '2025-07-18 11:52:46.335', '2025-07-21 19:44:51.091');
INSERT INTO public.providers VALUES ('cmd8luf4r0002s7v4shykm4un', 'cmd8luf470000s7v4r63i74sw', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'APPROVED', '2025-07-18 09:16:41.114', '2025-07-21 19:44:53.304');
INSERT INTO public.providers VALUES ('cmdea8gvx0002s7l0y4lrmuyv', 'cmdea8gv00000s7l0bag3fl01', 'John''s services', '2werftghbvc', 5, 150, 'East London', NULL, NULL, NULL, NULL, 'APPROVED', '2025-07-22 08:38:18.237', '2025-07-22 08:43:01.4');


--
-- Data for Name: ProviderReview; Type: TABLE DATA; Schema: public; Owner: servicehub_user
--

INSERT INTO public."ProviderReview" VALUES ('cmdeaejds0006s7l04pnjpyuj', 'cmdea8gvx0002s7l0y4lrmuyv', 'cmdd3uxl00000s73kerzcadcc', 'qwdrrf', 'APPROVED', '2025-07-22 08:43:01.408');


--
-- Data for Name: VerificationToken; Type: TABLE DATA; Schema: public; Owner: servicehub_user
--



--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: servicehub_user
--

INSERT INTO public._prisma_migrations VALUES ('0e30223a-d044-420f-b0bd-076845121d77', '78e82326bdbfc91c5ea04d0757108663b0e714c21528ead5232c94effcd62f50', '2025-07-18 10:15:54.245618+02', '20250718081554_add_verification_token_relation', NULL, NULL, '2025-07-18 10:15:54.1554+02', 1);
INSERT INTO public._prisma_migrations VALUES ('4f5c0744-537b-4d54-9d5b-c78f2b9f2c3c', 'f5573ff9eea6e5f4a543bd753d7adf9a59ac82f70915e098cefe141c7036b96f', '2025-07-21 22:24:26.765467+02', '20250721202426_add_provider_review', NULL, NULL, '2025-07-21 22:24:26.729461+02', 1);


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: servicehub_user
--



--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: servicehub_user
--



--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: servicehub_user
--



--
-- Data for Name: provider_services; Type: TABLE DATA; Schema: public; Owner: servicehub_user
--



--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: servicehub_user
--



--
-- PostgreSQL database dump complete
--

