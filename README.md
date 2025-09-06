# Proliink Connect - South Africa Service Marketplace

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://app.proliinkconnect.co.za)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Email Service](https://img.shields.io/badge/Email%20Service-Resend-green?style=for-the-badge&logo=resend)](https://resend.com)

## 🚀 Overview

Proliink Connect is South Africa's premier service marketplace platform, connecting clients with verified service providers across various industries. Built with Next.js, TypeScript, and PostgreSQL, featuring a robust email system powered by Resend.

## ✨ Features

- **🔐 Authentication System**: Secure user registration, email verification, and password reset
- **📧 Email Integration**: Transactional emails via Resend with custom domain `app.proliinkconnect.co.za`
- **🏢 Provider Management**: Complete provider onboarding and verification system
- **📅 Booking System**: Advanced booking management with escrow payments
- **💳 Payment Processing**: Integrated payment system with escrow functionality
- **📱 Responsive Design**: Mobile-first design with modern UI components
- **🔒 Security**: JWT authentication, rate limiting, and secure API endpoints

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Email Service**: Resend with custom domain
- **Authentication**: JWT with secure token management
- **Payments**: Paystack integration
- **Deployment**: Vercel

## 📧 Email System

The platform uses Resend for all transactional emails with the domain `app.proliinkconnect.co.za`:

- **Email Verification**: Welcome emails with verification links
- **Password Reset**: Secure password reset functionality
- **Booking Confirmations**: Detailed booking confirmation emails
- **Provider Notifications**: Service provider communication

### Email Templates
- Professional HTML templates with text fallbacks
- Responsive design for all devices
- Branded with Proliink Connect styling
- Accessibility-compliant

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Resend API key
- Domain configured with DNS records

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ConnectSA-k9
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your `.env.local`:
   ```bash
   # Database
   DATABASE_URL=your_postgresql_connection_string
   
   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   
   # Email Service (Resend)
   RESEND_API_KEY=your_resend_api_key
   FROM_EMAIL=no-reply@app.proliinkconnect.co.za
   
   # App Configuration
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📧 Email Configuration

### DNS Setup
Follow the comprehensive guide in `RESEND_DNS_SETUP_GUIDE.md` to configure DNS records for `app.proliinkconnect.co.za`.

### Required DNS Records
- **Domain Verification**: TXT record for Resend verification
- **Email Tracking**: CNAME record for email analytics
- **SPF Record**: Prevents email spoofing
- **DKIM Record**: Ensures email integrity
- **DMARC Record**: Email authentication policy

### Testing Emails
Use the comprehensive email testing API:

```bash
# Test basic email
curl -X POST http://localhost:3000/api/test-email-comprehensive \
  -H "Content-Type: application/json" \
  -d '{"testType": "basic", "email": "test@example.com"}'

# Test verification email
curl -X POST http://localhost:3000/api/test-email-comprehensive \
  -H "Content-Type: application/json" \
  -d '{"testType": "verification", "email": "test@example.com"}'

# Test booking confirmation
curl -X POST http://localhost:3000/api/test-email-comprehensive \
  -H "Content-Type: application/json" \
  -d '{"testType": "booking-confirmation", "email": "test@example.com"}'
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run email verification tests
npm run test:email-verification
```

### Email Testing
```bash
# Test email verification flow
npm run test:email-verification

# Test provider onboarding
npm run test:provider-onboarding
```

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── book-service/  # Booking system
│   │   └── test-email*/   # Email testing endpoints
│   ├── admin/             # Admin dashboard
│   ├── provider/          # Provider dashboard
│   └── dashboard/         # Client dashboard
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── admin/            # Admin-specific components
│   └── provider/         # Provider-specific components
├── emails/               # Email templates
│   └── templates/        # HTML email templates
├── lib/                  # Utility libraries
│   ├── email.ts          # Email service
│   ├── auth.ts           # Authentication utilities
│   └── db-utils.ts       # Database utilities
├── prisma/               # Database schema
└── scripts/              # Utility scripts
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset
- `GET /api/auth/verify-email` - Email verification

### Booking System
- `POST /api/book-service` - Create booking
- `POST /api/book-service/send-offer` - Send job offer
- `POST /api/book-service/[id]/accept` - Accept booking
- `POST /api/book-service/[id]/decline` - Decline booking

### Email Testing
- `POST /api/test-email` - Basic email test
- `POST /api/test-email-comprehensive` - Comprehensive email testing

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables (Production)
```bash
DATABASE_URL=your_production_database_url
JWT_SECRET=your_production_jwt_secret
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=no-reply@app.proliinkconnect.co.za
NEXTAUTH_SECRET=your_production_nextauth_secret
NEXTAUTH_URL=https://app.proliinkconnect.co.za
```

## Database and Prisma Setup

### Runtime vs CLI URLs
- Runtime (application server): uses the Supabase pooler for safe connection handling in serverless and long‑lived servers.
  - Add to `.env`:
  ```bash
  DATABASE_URL="postgresql://postgres:<password>@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=10&pool_timeout=60&connection_limit=5"
  PRISMA_DISABLE_PREPARED_STATEMENTS=true
  ```
- CLI and migrations (schema operations): use the direct PostgreSQL connection.
  - Add to `.env`:
  ```bash
  DIRECT_URL="postgresql://postgres:<password>@db.<PROJECT-REF>.supabase.co:5432/postgres?sslmode=require"
  ```

Prisma `prisma/schema.prisma` uses:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```
This makes runtime use the pooler via `DATABASE_URL`, while Prisma schema commands automatically use `DIRECT_URL`.

### Prisma Singleton
- `lib/prisma.ts` exports a single `PrismaClient` instance using a `globalThis` guard.
- Only import the client from `@/lib/prisma` in server code.
- All API routes that use Prisma must include:
```ts
export const runtime = 'nodejs'
```

### Migrations and Introspection
Run these with the `.env` configured above (Prisma will pick `DIRECT_URL` automatically for schema ops):
```bash
npx prisma generate
npx prisma migrate dev --name <migration-name>
npx prisma db pull
```

### Manual psql (optional)
Use the direct connection for manual SQL (replace placeholders):
```bash
psql "postgresql://postgres:<password>@db.<PROJECT-REF>.supabase.co:5432/postgres?sslmode=require" -c "select 1"
```

### Notes
- Ensure no API route runs on Edge when using Prisma. All Prisma-using routes declare `export const runtime = 'nodejs'`.
- Avoid prepared statement issues with PgBouncer using `PRISMA_DISABLE_PREPARED_STATEMENTS=true`.

## 📊 Monitoring

### Email Analytics
- Monitor email delivery rates in Resend dashboard
- Track open rates and click rates
- Handle bounce management and spam complaints

### Application Monitoring
- Vercel Analytics for performance monitoring
- Database monitoring via Supabase
- Error tracking and logging

## 🔒 Security

- JWT-based authentication with secure token management
- Rate limiting on API endpoints
- Input validation and sanitization
- Secure password hashing with bcrypt
- Email verification for account security
- CORS configuration for API security

## 📚 Documentation

- `RESEND_DNS_SETUP_GUIDE.md` - Complete DNS setup guide
- `RESEND_INTEGRATION_GUIDE.md` - Email integration guide
- `EMAIL_VERIFICATION_TESTING_README.md` - Email testing guide
- `PASSWORD_RESET_SYSTEM_README.md` - Password reset documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation in the `/docs` folder
- Review the troubleshooting guides
- Contact the development team

---

**Built with ❤️ for South Africa's service marketplace**