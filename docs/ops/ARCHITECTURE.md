# ConnectSA Architecture Overview

## 🎯 Executive Summary

**ConnectSA** (Proliink Connect) is a comprehensive service marketplace platform connecting clients with verified service providers across South Africa. The platform handles the complete lifecycle from service discovery to payment processing, including escrow management, real-time notifications, and provider management.

---

## 🏗️ System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (Frontend)                    │
│  Next.js 14 + React 18 + TypeScript + Tailwind CSS          │
│  - Client Dashboard  - Provider Dashboard  - Admin Panel   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTPS/WebSocket
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                  API LAYER (Backend)                         │
│  Next.js API Routes + Middleware + Authentication            │
│  - REST APIs  - WebSocket (Socket.IO)  - Webhooks            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              BUSINESS LOGIC LAYER                            │
│  - Payment Processing (Paystack)  - Escrow Management      │
│  - Booking Service  - Notification Service  - Ledger        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              DATA LAYER                                      │
│  PostgreSQL (Supabase) + Prisma ORM                          │
│  - User Data  - Bookings  - Payments  - Ledger              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Core Components

### 1. Authentication & Authorization System

**How It Works:**
- Users sign up → Email verification → Login → JWT token stored in secure cookie
- Middleware validates tokens on protected routes
- Role-based access: CLIENT, PROVIDER, ADMIN

**Technical Details:**
- JWT tokens signed with `NEXTAUTH_SECRET`
- Tokens stored in HTTP-only cookies (secure, not accessible via JavaScript)
- Middleware (`middleware.ts`) validates tokens before API/page access
- Email verification required before login

**Key Files:**
- `lib/auth.ts` - Core authentication functions
- `middleware.ts` - Route protection
- `app/api/auth/*` - Authentication endpoints

---

### 2. Booking System

**User Journey:**
1. Client browses services → Selects service → Chooses provider
2. Fills booking form (date, time, address, notes)
3. System creates booking with `PENDING` status
4. Provider receives notification
5. Provider accepts/declines
6. If accepted → Booking moves to `CONFIRMED` → Payment required

**Technical Flow:**
```
Client submits booking
    ↓
POST /api/book-service/send-offer-enhanced
    ↓
Create Booking record (status: PENDING)
    ↓
Create Payment record (if ONLINE payment method)
    ↓
Send notifications (Provider + Client)
    ↓
Provider accepts → Booking status: CONFIRMED
    ↓
Client pays → Payment status: ESCROW
    ↓
Provider starts job → Booking status: IN_PROGRESS
    ↓
Provider completes → Booking status: COMPLETED
    ↓
Client releases payment → Funds transferred to provider
```

**Key Models:**
- `Booking` - Main booking record
- `CatalogueItem` - Provider service packages
- `BookingDraft` - Auto-saved form data

**Key Files:**
- `app/api/book-service/send-offer-enhanced/route.ts`
- `app/api/book-service/[id]/accept/route.ts`
- `lib/services/booking-service.ts`

---

### 3. Payment & Escrow System

**Concept:**
- Escrow holds funds until work is completed
- Client pays → Funds held → Provider completes → Funds released

**Payment Flow (Online):**
```
1. CLIENT INITIATES PAYMENT
   POST /api/book-service/[id]/pay
   ↓
2. PAYSTACK PAYMENT GATEWAY
   - Creates payment session
   - Returns authorization URL
   - Client redirected to Paystack
   ↓
3. CLIENT COMPLETES PAYMENT
   - Card/bank transfer on Paystack
   - Paystack processes payment
   ↓
4. WEBHOOK RECEIVED
   POST /api/webhooks/paystack
   - Validates webhook signature
   - Updates Payment status: ESCROW
   - Updates Booking status: PENDING_EXECUTION
   ↓
5. PROVIDER COMPLETES JOB
   POST /api/book-service/[id]/complete
   - Uploads proof of completion
   - Booking status: COMPLETED
   ↓
6. CLIENT RELEASES PAYMENT
   POST /api/book-service/[id]/release-payment
   - Creates Payout record
   - Transfers funds via Paystack Transfer API
   - Payment status: RELEASED
   - Provider receives money
```

**Payment Flow (Cash):**
```
1. CLIENT SELECTS CASH PAYMENT
   - Booking created with paymentMethod: CASH
   - Payment status: CASH_PENDING
   ↓
2. CLIENT CLAIMS PAYMENT
   POST /api/book-service/[id]/release-payment
   - Payment status: CASH_PAID
   - Provider notified to confirm receipt
   ↓
3. PROVIDER CONFIRMS RECEIPT
   - Provider confirms they received cash
   - Payment status: CASH_VERIFIED
   - Booking can be completed
```

**Payment Statuses:**
- `PENDING` - Payment initiated, not completed
- `ESCROW` / `HELD_IN_ESCROW` - Funds held in escrow
- `PROCESSING_RELEASE` - Transfer in progress
- `RELEASED` - Funds transferred to provider
- `REFUNDED` - Money returned to client
- `FAILED` - Payment failed
- `CASH_PENDING` - Cash payment awaiting client claim
- `CASH_PAID` - Client claims they paid cash
- `CASH_VERIFIED` - Provider confirmed cash receipt

**Financial Breakdown:**
- **Total Amount** = Service price
- **Platform Fee** = 10% of total
- **Escrow Amount** = Total - Platform fee (goes to provider)

**Key Files:**
- `app/api/book-service/[id]/pay/route.ts` - Payment initiation
- `app/api/book-service/[id]/release-payment/route.ts` - Escrow release
- `app/api/webhooks/paystack/route.ts` - Webhook handler
- `lib/paystack.ts` - Paystack integration

---

### 4. Ledger System

**Purpose:**
- Tracks all money movements
- Prevents double-crediting
- Provides audit trail

**How It Works:**
```
Every financial transaction creates ledger entries:

PAYMENT RECEIVED:
  - CREDIT: PROVIDER_BALANCE (escrow amount)
  - DEBIT: PLATFORM_BALANCE (platform fee)

PAYOUT EXECUTED:
  - DEBIT: PROVIDER_BALANCE (amount paid out)
  - CREDIT: BANK_ACCOUNT (actual transfer)

REFUND ISSUED:
  - DEBIT: PROVIDER_BALANCE (if already credited)
  - CREDIT: CLIENT_BALANCE (refund amount)
```

**Idempotency:**
- Prevents duplicate entries
- Checks for existing entries before creating
- Uses reference IDs (payment ID, payout ID)

**Key Files:**
- `lib/ledger-hardened.ts` - Hardened ledger service
- `lib/ledger.ts` - Basic ledger operations

---

### 5. Notification System

**Channels:**
1. **In-App Notifications** (Database)
2. **Email Notifications** (Resend)
3. **Push Notifications** (Web Push API)

**How It Works:**
```
Booking Event Occurs
    ↓
Notification Service Triggered
    ↓
┌─────────────┬──────────────┬──────────────┐
│ In-App      │ Email        │ Push         │
│ (Instant)   │ (1-2 sec)    │ (Instant)    │
└─────────────┴──────────────┴──────────────┘
    ↓              ↓              ↓
Saved to DB    Sent via      Sent via
               Resend API    Web Push API
```

**Notification Types:**
- `BOOKING_CREATED` - New booking request
- `BOOKING_ACCEPTED` - Provider accepted
- `BOOKING_DECLINED` - Provider declined
- `PAYMENT_RECEIVED` - Payment in escrow
- `PAYMENT_RELEASED` - Funds released
- `JOB_STARTED` - Provider started work
- `JOB_COMPLETED` - Work finished
- `REVIEW_SUBMITTED` - Client left review

**Real-Time Updates:**
- WebSocket (Socket.IO) for instant updates
- Polling fallback (60 seconds) if WebSocket fails
- Auto-refresh on dashboards

**Key Files:**
- `lib/notification-service-enhanced.ts` - Multi-channel service
- `lib/push-notification-service.ts` - Push notifications
- `lib/email.ts` - Email service
- `hooks/use-notifications.ts` - React hook for notifications

---

### 6. Provider Management

**Provider Lifecycle:**
```
1. USER SIGNS UP AS PROVIDER
   - Creates User account (role: PROVIDER)
   - Creates Provider profile (status: PENDING)
   ↓
2. PROVIDER ONBOARDING
   - Uploads documents (ID, proof of address)
   - Sets business details
   - Adds bank account information
   ↓
3. ADMIN REVIEW
   - Admin reviews documents
   - Approves/Rejects provider
   - Status: APPROVED or REJECTED
   ↓
4. PROVIDER SETS UP CATALOGUE
   - Creates service packages (CatalogueItem)
   - Sets prices and durations
   - Uploads images
   ↓
5. PROVIDER CAN RECEIVE BOOKINGS
   - Appears in provider discovery
   - Can accept/decline bookings
   - Can receive payments
```

**Provider Statuses:**
- `PENDING` - Awaiting admin approval
- `APPROVED` - Can receive bookings
- `REJECTED` - Application denied
- `SUSPENDED` - Temporarily blocked
- `INCOMPLETE` - Missing required information

**Key Files:**
- `app/api/provider/*` - Provider endpoints
- `app/provider/onboarding/page.tsx` - Onboarding flow
- `app/admin/providers/page.tsx` - Admin provider management

---

### 7. Admin Dashboard

**Features:**
- User management (suspend, delete, role changes)
- Provider approval/rejection
- Payment oversight
- Payout approval
- Dispute resolution
- Analytics and reporting
- Audit logs

**Key Files:**
- `app/admin/*` - Admin dashboard pages
- `lib/admin-data-service.ts` - Admin data operations
- `app/api/admin/*` - Admin API endpoints

---

## 📊 Database Schema

### Core Models

**1. User**
- Authentication and profile information
- Roles: CLIENT, PROVIDER, ADMIN
- Email verification status

**2. Provider**
- Business information
- Bank details for payouts
- Verification documents
- Catalogue items

**3. Booking**
- Links client, provider, service
- Status tracking
- Payment method (ONLINE/CASH)

**4. Payment**
- Paystack integration
- Escrow tracking
- Status lifecycle

**5. Payout**
- Provider payouts
- Admin approval workflow
- Transfer tracking

**6. Notification**
- In-app notifications
- Read/unread status

**7. LedgerEntry**
- Financial audit trail
- Double-entry accounting

**8. CatalogueItem**
- Provider service packages
- Pricing and images

---

## 🔒 Security Features

**1. Authentication:**
- JWT tokens in HTTP-only cookies
- Email verification required
- Password hashing with bcrypt

**2. Authorization:**
- Role-based access control
- Route protection via middleware
- API endpoint validation

**3. Payment Security:**
- Webhook signature validation
- Idempotent operations
- Atomic transactions

**4. Data Protection:**
- SQL injection prevention (Prisma)
- Input validation (Zod)
- XSS protection headers

---

## 🛠️ Technology Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Radix UI components
- Socket.IO Client (real-time)

**Backend:**
- Next.js API Routes
- Prisma ORM
- PostgreSQL (Supabase)
- Socket.IO Server

**External Services:**
- Paystack (payments)
- Resend (email)
- Supabase (database + storage)

---

## 🔄 Data Flow Examples

### Example 1: Complete Booking Flow

```
1. CLIENT: Browses services → Selects "House Cleaning"
2. CLIENT: Chooses provider → Views catalogue items
3. CLIENT: Fills booking form → Submits booking
   → API: POST /api/book-service/send-offer-enhanced
   → Creates Booking (PENDING)
   → Creates Payment (PENDING, if ONLINE)
   → Sends notifications
4. PROVIDER: Receives notification → Opens dashboard
5. PROVIDER: Accepts booking
   → API: POST /api/book-service/[id]/accept
   → Booking status: CONFIRMED
   → Client notified
6. CLIENT: Pays for booking
   → API: POST /api/book-service/[id]/pay
   → Redirects to Paystack
   → Client completes payment
   → Webhook: Payment status → ESCROW
   → Booking status: PENDING_EXECUTION
7. PROVIDER: Starts job
   → API: POST /api/book-service/[id]/start
   → Booking status: IN_PROGRESS
8. PROVIDER: Completes job → Uploads proof
   → API: POST /api/book-service/[id]/complete
   → Booking status: COMPLETED
9. CLIENT: Releases payment
   → API: POST /api/book-service/[id]/release-payment
   → Creates Payout
   → Transfers funds to provider
   → Payment status: RELEASED
10. CLIENT: Leaves review
    → API: POST /api/book-service/[id]/review
    → Review saved
```

### Example 2: Payment Recovery

```
If payment gets stuck in PENDING status:
1. System detects stuck payment
2. Calls Paystack API to verify payment
3. If payment successful → Updates to ESCROW
4. If payment failed → Updates to FAILED
5. Client notified of status change
```

---

## 💡 Key Design Decisions

**1. Escrow System:**
- Protects both clients and providers
- Funds released only after completion

**2. Multi-Channel Notifications:**
- Ensures users are always informed
- Fallback if one channel fails

**3. Idempotent Operations:**
- Prevents duplicate charges
- Safe to retry

**4. Atomic Transactions:**
- Database consistency
- All-or-nothing operations

**5. Real-Time Updates:**
- Better user experience
- Polling fallback for reliability

---

## 🚀 Deployment

- **Hosting:** Vercel
- **Database:** Supabase (PostgreSQL)
- **Environment:** Separate dev/production
- **CI/CD:** GitHub Actions
- **Monitoring:** Vercel Analytics + custom logging

---

## 📝 Summary

ConnectSA is a comprehensive marketplace platform with:
- ✅ Secure authentication and authorization
- ✅ Complete booking management
- ✅ Escrow payment system
- ✅ Real-time notifications
- ✅ Provider onboarding and management
- ✅ Admin oversight
- ✅ Financial ledger tracking

The architecture prioritizes security, reliability, and user experience, with multiple safeguards for financial transactions and real-time communication.

---

*Last Updated: 2024*
*Version: 1.0*
