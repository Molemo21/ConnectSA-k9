# ConnectSA-k9 - Project Overview

**Generated:** January 2025  
**Project Type:** Service Marketplace Platform  
**Tech Stack:** Next.js 14, TypeScript, PostgreSQL, Prisma, Paystack, Resend

---

## 🎯 Project Purpose

**Proliink Connect** is a comprehensive service marketplace platform connecting clients with verified service providers across South Africa. The platform facilitates service bookings, secure escrow payments, real-time communication, and complete booking lifecycle management.

---

## 🏗️ Architecture Overview

### **Technology Stack**

#### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI, shadcn/ui
- **State Management:** React Context, SWR for data fetching
- **Real-time:** Socket.IO client
- **Forms:** React Hook Form with Zod validation

#### Backend
- **API:** Next.js API Routes
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma 6.17.0
- **Authentication:** JWT (jose library)
- **Password Hashing:** bcryptjs

#### External Services
- **Payments:** Paystack (South African payment gateway)
- **Email:** Resend (custom domain: app.proliinkconnect.co.za)
- **Storage:** Supabase Storage
- **Deployment:** Vercel

#### Real-time Features
- **WebSockets:** Socket.IO for real-time updates
- **Push Notifications:** Web Push API with service workers
- **Notifications:** Multi-channel (in-app, email, push)

---

## 📊 Database Schema

### **Core Models**

#### User Management
- **User:** Base user model with roles (CLIENT, PROVIDER, ADMIN)
- **Provider:** Extended profile for service providers
- **VerificationToken:** Email verification tokens
- **PasswordResetToken:** Password reset tokens

#### Service & Booking System
- **ServiceCategory:** Service categories (cleaning, plumbing, etc.)
- **Service:** Individual services within categories
- **CatalogueItem:** Provider-specific service offerings with pricing
- **Booking:** Service bookings with status tracking
- **BookingDraft:** Draft bookings for multi-step booking flow

#### Payment System
- **Payment:** Payment records with Paystack integration
- **Transfer:** Provider payout records (via Paystack Transfer API)
- **PaymentStatus Enum:** PENDING → ESCROW → PROCESSING_RELEASE → RELEASED/REFUNDED

#### Reviews & Notifications
- **Review:** Client reviews for providers
- **ProviderReview:** Admin reviews for provider verification
- **Notification:** In-app notifications
- **PushSubscription:** Web push notification subscriptions

### **Key Enums**

```typescript
UserRole: CLIENT | PROVIDER | ADMIN
ProviderStatus: PENDING | APPROVED | REJECTED | SUSPENDED | INCOMPLETE
BookingStatus: PENDING | CONFIRMED | IN_PROGRESS | AWAITING_CONFIRMATION | 
               COMPLETED | CANCELLED | PENDING_EXECUTION | PAYMENT_PROCESSING | DISPUTED
PaymentMethod: ONLINE | CASH
PaymentStatus: PENDING | ESCROW | HELD_IN_ESCROW | PROCESSING_RELEASE | 
               RELEASED | REFUNDED | FAILED | COMPLETED | CASH_PENDING | 
               CASH_PAID | CASH_RECEIVED | CASH_VERIFIED
```

---

## 🔐 Authentication & Authorization

### **Authentication Flow**
1. User registration with email verification
2. JWT token-based authentication
3. Cookie-based session management (`auth-token` cookie)
4. Role-based access control (RBAC)
5. Middleware protection for routes

### **Key Files**
- `lib/auth.ts` - Core authentication utilities
- `lib/auth-middleware.ts` - Route protection
- `middleware.ts` - Next.js middleware for route protection
- `app/api/auth/*` - Authentication API endpoints

### **Protected Routes**
- `/dashboard` - Client dashboard
- `/provider/dashboard` - Provider dashboard
- `/admin/*` - Admin dashboard
- Most API routes require authentication

---

## 💳 Payment System

### **Escrow Payment Flow**

1. **Payment Initialization**
   - Client initiates payment via `/api/book-service/[id]/pay`
   - Paystack payment session created
   - Payment record created with `PENDING` status

2. **Funds Held in Escrow**
   - Paystack webhook confirms payment success
   - Payment status → `ESCROW` / `HELD_IN_ESCROW`
   - Booking status → `PENDING_EXECUTION`
   - Provider notified payment received

3. **Service Execution**
   - Provider completes service
   - Uploads proof of completion
   - Client confirms completion

4. **Escrow Release**
   - Client confirms or auto-confirms after 3 days
   - Payment status → `PROCESSING_RELEASE`
   - Paystack Transfer API transfers funds to provider
   - Payment status → `RELEASED`
   - Booking status → `COMPLETED`

5. **Dispute Handling**
   - Disputes keep funds in escrow
   - Admin reviews and decides payout or refund

### **Payment Features**
- **Platform Fee:** 10% automatically calculated
- **Cash Payments:** Alternative payment method support
- **Webhook Processing:** Secure webhook signature validation
- **Idempotency:** Prevents duplicate processing

### **Key Files**
- `lib/paystack.ts` - Paystack client and payment processor
- `app/api/webhooks/paystack/route.ts` - Webhook handler
- `app/api/book-service/[id]/pay/route.ts` - Payment initialization
- `app/api/book-service/[id]/release-escrow/route.ts` - Escrow release

---

## 📅 Booking System

### **Booking Flow**

1. **Service Selection**
   - Client browses services/categories
   - Selects service type
   - Views provider catalogue items

2. **Provider Discovery**
   - Auto-match or manual selection
   - Provider discovery API with filtering
   - Catalogue-based pricing

3. **Booking Creation**
   - Multi-step booking form
   - Draft preservation (saved automatically)
   - Date/time scheduling
   - Address and description

4. **Provider Response**
   - Provider accepts/declines booking
   - Client notified of response
   - Booking status updated

5. **Payment & Execution**
   - Payment processing
   - Service execution tracking
   - Completion confirmation
   - Review submission

### **Booking States**
```
PENDING → CONFIRMED → PENDING_EXECUTION → IN_PROGRESS → COMPLETED
    ↓         ↓              ↓                ↓
CANCELLED  DISPUTED    PAYMENT_PROCESSING
```

### **Key Features**
- **Draft Preservation:** Auto-save booking drafts
- **Step Resumption:** Resume from last completed step
- **Provider Matching:** Smart provider discovery
- **Catalogue Pricing:** Provider-specific pricing

### **Key Files**
- `app/api/book-service/route.ts` - Main booking endpoint
- `app/api/book-service/discover-providers/route.ts` - Provider discovery
- `app/api/bookings/drafts/*` - Draft management
- `components/book-service/*` - Booking UI components

---

## 🔔 Notification System

### **Multi-Channel Notifications**

1. **In-App Notifications**
   - Database-stored notifications
   - Real-time updates via WebSocket
   - Notification bell with unread count
   - Mark as read/delete functionality

2. **Email Notifications**
   - Resend integration
   - HTML email templates
   - Mobile-responsive design
   - Transactional emails for all events

3. **Push Notifications**
   - Web Push API
   - Service worker integration
   - Browser notification prompts
   - Offline notification support

### **Notification Types**
- Booking created/accepted/declined
- Payment received/processed
- Service started/completed
- Payout updates
- Admin actions

### **Key Files**
- `lib/notification-service.ts` - Core notification service
- `lib/notification-service-enhanced.ts` - Multi-channel orchestrator
- `hooks/use-notifications.ts` - Notification hooks
- `components/ui/notification-bell.tsx` - UI component
- `app/api/notifications/*` - Notification API

---

## 🔌 Real-time Features

### **WebSocket Implementation**

- **Socket.IO Server:** `lib/socket-server.ts`
- **Socket.IO Client:** `lib/socket-client.ts`
- **React Hook:** `hooks/use-websocket.ts`

### **Real-time Events**
- Booking status updates
- Payment status changes
- Payout updates
- New notifications
- Provider availability changes

### **Features**
- Automatic reconnection
- Polling fallback
- User-specific rooms
- Event broadcasting
- Connection management

---

## 👥 User Roles & Dashboards

### **Client Dashboard**
- **Location:** `/dashboard`
- **Features:**
  - View bookings (current, past, upcoming)
  - Booking management (cancel, reschedule)
  - Payment tracking
  - Review providers
  - Profile management

### **Provider Dashboard**
- **Location:** `/provider/dashboard`
- **Features:**
  - Booking management (accept/decline)
  - Earnings tracking
  - Catalogue management
  - Service completion
  - Bank details setup
  - Reviews display

### **Admin Dashboard**
- **Location:** `/admin/dashboard`
- **Features:**
  - User management
  - Provider approval/rejection
  - Booking oversight
  - Payment management
  - System analytics
  - Audit logs
  - Dispute resolution

---

## 📧 Email System

### **Email Service**
- **Provider:** Resend
- **Domain:** app.proliinkconnect.co.za
- **Templates:** HTML templates with text fallbacks

### **Email Types**
- Email verification
- Password reset
- Booking confirmations
- Payment notifications
- Provider notifications
- Admin notifications

### **Key Files**
- `lib/email.ts` - Email service
- `lib/email-templates.ts` - Email templates
- `emails/templates/*` - HTML templates

---

## 🗂️ Project Structure

```
ConnectSA-k9/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── book-service/  # Booking system
│   │   ├── bookings/      # Booking management
│   │   ├── payment/       # Payment processing
│   │   ├── provider/      # Provider endpoints
│   │   ├── admin/         # Admin endpoints
│   │   ├── notifications/ # Notification system
│   │   └── webhooks/      # Webhook handlers
│   ├── admin/             # Admin dashboard pages
│   ├── provider/          # Provider dashboard pages
│   ├── dashboard/         # Client dashboard
│   └── [other pages]      # Public pages
├── components/            # React components
│   ├── ui/                # Reusable UI components
│   ├── admin/             # Admin components
│   ├── provider/          # Provider components
│   ├── dashboard/         # Dashboard components
│   └── book-service/      # Booking components
├── lib/                   # Utility libraries
│   ├── auth.ts            # Authentication
│   ├── paystack.ts        # Payment processing
│   ├── email.ts           # Email service
│   ├── notification-service.ts
│   ├── socket-server.ts   # WebSocket server
│   └── [other utilities]
├── hooks/                 # React hooks
├── contexts/              # React contexts
├── prisma/                # Database schema & migrations
├── public/                # Static assets
├── scripts/               # Utility scripts
└── [config files]         # Configuration files
```

---

## 🔧 Key Configuration

### **Environment Variables**
```bash
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Authentication
JWT_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...

# Paystack
PAYSTACK_SECRET_KEY=...
PAYSTACK_PUBLIC_KEY=...

# Email (Resend)
RESEND_API_KEY=...
FROM_EMAIL=no-reply@app.proliinkconnect.co.za

# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=...
```

### **Database Configuration**
- **Runtime:** Uses Supabase pooler (`DATABASE_URL`)
- **CLI/Migrations:** Uses direct connection (`DIRECT_URL`)
- **Prisma:** Configured for both connections

---

## 🚀 Deployment

### **Platform:** Vercel
- Automatic deployments from Git
- Environment variables configured
- Production database: Supabase PostgreSQL

### **Build Process**
1. Prisma generate
2. Next.js build
3. Static optimization

### **Key Considerations**
- OneDrive file lock issues (mitigated)
- Build-time environment variable handling
- Database connection pooling
- Webhook URL configuration

---

## 📝 Key Features Summary

### ✅ **Implemented**
- Multi-role authentication system
- Email verification & password reset
- Service booking system with drafts
- Escrow payment system (Paystack)
- Provider onboarding & verification
- Real-time notifications (multi-channel)
- WebSocket real-time updates
- Admin dashboard with analytics
- Provider catalogue system
- Review & rating system
- Cash payment support
- Booking lifecycle management
- Dispute handling framework

### 🚧 **In Progress / Planned**
- Complete dispute resolution UI
- Advanced analytics
- Mobile app (PWA ready)
- Enhanced search & filtering
- Provider availability calendar

---

## 🧪 Testing

### **Test Structure**
- Unit tests: `__tests__/`
- Integration tests: `tests/integration/`
- E2E tests: Playwright (`playwright.config.ts`)
- Admin tests: `__tests__/admin/`

### **Test Scripts**
```bash
npm test              # Run all tests
npm run test:e2e      # E2E tests
npm run test:admin    # Admin tests
```

---

## 📚 Documentation

The project includes extensive documentation:
- Feature implementation guides
- Deployment guides
- Testing guides
- Troubleshooting guides
- API documentation (in code)

---

## 🔍 Key Insights

1. **Complex State Management:** Multiple booking states, payment states, and user roles require careful state management
2. **Real-time Requirements:** WebSocket + polling fallback ensures reliability
3. **Payment Security:** Escrow system protects both clients and providers
4. **Scalability:** Database connection pooling, caching strategies
5. **User Experience:** Draft preservation, step resumption, multi-channel notifications

---

## 🛠️ Development Workflow

1. **Local Development**
   ```bash
   npm install
   cp .env.example .env.local
   npx prisma generate
   npx prisma db push
   npm run dev
   ```

2. **Database Migrations**
   ```bash
   npx prisma migrate dev --name migration_name
   npx prisma generate
   ```

3. **Testing**
   ```bash
   npm test
   npm run test:e2e
   ```

---

## 📞 Support & Resources

- **Documentation:** Extensive markdown files in root directory
- **Database:** Prisma Studio (`npm run db:studio`)
- **Logging:** Centralized logging system (`lib/logger.ts`)
- **Error Handling:** Comprehensive error boundaries

---

**Last Updated:** January 2025  
**Project Status:** Production Ready


