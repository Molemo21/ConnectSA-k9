# 🚀 Production Deployment Guide - Best Practices

## 📋 **Pre-Deployment Checklist**

### **1. Code Quality & Testing**
- [ ] All tests passing (`npm run test:all`)
- [ ] Code linting clean (`npm run lint`)
- [ ] TypeScript compilation successful (`npm run build`)
- [ ] Database schema synchronized (`npm run db:sync`)
- [ ] Environment variables documented

### **2. Database Preparation**
- [ ] Database migrations ready (`npx prisma migrate dev`)
- [ ] Backup current production database
- [ ] Verify schema matches Prisma schema
- [ ] Test database connection from production environment

### **3. Environment Configuration**
- [ ] All environment variables set in production
- [ ] Secrets properly configured
- [ ] Database URLs point to production
- [ ] API keys are production keys (not test keys)

## 🔧 **Environment Setup**

### **Step 1: Configure Production Environment Variables**

Create a `.env.production` file with these variables:

```bash
# Database Configuration
DATABASE_URL="postgresql://postgres:<password>@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=15&pool_timeout=60&connection_limit=5"
PRISMA_DISABLE_PREPARED_STATEMENTS=true
DIRECT_URL="postgresql://postgres:<password>@aws-0-eu-west-1.supabase.com:5432/postgres?sslmode=require"

# Authentication
JWT_SECRET="your-super-secure-jwt-secret-here-min-32-chars"
JWT_EXPIRES_IN="7d"
NEXTAUTH_SECRET="your-nextauth-secret-here-min-32-chars"
NEXTAUTH_URL="https://your-domain.com"

# Email Service (Resend)
RESEND_API_KEY="re_your-production-resend-api-key"
FROM_EMAIL="no-reply@your-domain.com"

# Payment Service (Paystack)
PAYSTACK_SECRET_KEY="sk_live_your-production-secret-key"
PAYSTACK_PUBLIC_KEY="pk_live_your-production-public-key"
PAYSTACK_TEST_MODE=false
PAYSTACK_WEBHOOK_URL="https://your-domain.com/api/webhooks/paystack"

# App Configuration
NODE_ENV=production
COOKIE_DOMAIN=your-domain.com
LOG_LEVEL=info

# Optional: Monitoring
SENTRY_DSN="your-sentry-dsn-if-using"
```

### **Step 2: Set Environment Variables in Deployment Platform**

#### **For Vercel:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable with appropriate environment (Production)
3. Ensure `NODE_ENV=production` is set

#### **For Other Platforms:**
- **Railway**: Use Railway dashboard environment variables
- **DigitalOcean App Platform**: Use app settings environment variables
- **AWS/GCP/Azure**: Use respective secret management services

## 🗄️ **Database Migration Strategy**

### **Step 1: Backup Current Database**
```bash
# Create backup before migration
pg_dump -h your-db-host -U your-user -d your-db > backup-$(date +%Y%m%d-%H%M%S).sql
```

### **Step 2: Apply Migrations**
```bash
# Generate Prisma client
npx prisma generate

# Deploy migrations to production
npx prisma migrate deploy

# Verify schema sync
npm run db:sync
```

### **Step 3: Verify Database State**
```bash
# Test database connection
node -e "
const { prisma } = require('./lib/prisma');
prisma.\$queryRaw\`SELECT 1\`.then(() => {
  console.log('✅ Database connection successful');
  process.exit(0);
}).catch(err => {
  console.error('❌ Database connection failed:', err);
  process.exit(1);
});
"
```

## 🚀 **Deployment Process**

### **Method 1: Vercel Deployment (Recommended)**

#### **Automatic Deployment:**
```bash
# Push to main branch triggers automatic deployment
git add .
git commit -m "feat: production sync fixes and deployment improvements"
git push origin main
```

#### **Manual Deployment:**
1. Go to Vercel Dashboard
2. Select your project
3. Click "Deployments" tab
4. Click "Redeploy" on latest deployment

### **Method 2: Manual Server Deployment**

```bash
# On your production server
cd /path/to/your/app

# Pull latest changes
git pull origin main

# Install dependencies
npm ci --production

# Generate Prisma client
npx prisma generate

# Deploy database migrations
npx prisma migrate deploy

# Build application
npm run build

# Restart application
pm2 restart your-app-name
# or
systemctl restart your-app-service
```

### **Method 3: Docker Deployment**

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Build the application
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
ENV PORT 3000

CMD ["npm", "start"]
```

```bash
# Build and deploy with Docker
docker build -t your-app-name .
docker run -d --name your-app-container -p 3000:3000 --env-file .env.production your-app-name
```

## ✅ **Post-Deployment Verification**

### **Step 1: Automated Verification**
```bash
# Run comprehensive verification
npm run verify:production https://your-domain.com
```

### **Step 2: Manual Testing**

#### **Health Checks:**
- [ ] Homepage loads: `https://your-domain.com`
- [ ] API health: `https://your-domain.com/api/debug/environment`
- [ ] Database connection: `https://your-domain.com/api/services`

#### **Core Functionality:**
- [ ] User registration works
- [ ] User login works
- [ ] Booking flow complete end-to-end
- [ ] Payment processing works
- [ ] Email notifications sent
- [ ] Admin dashboard accessible

#### **API Endpoints:**
```bash
# Test critical endpoints
curl -X GET https://your-domain.com/api/services
curl -X GET https://your-domain.com/api/webhooks/paystack
curl -X POST https://your-domain.com/api/auth/me
```

### **Step 3: Database Verification**
```bash
# Verify database state
npm run db:sync
```

## 📊 **Monitoring & Alerting**

### **Application Monitoring**

#### **Set up Logging:**
```typescript
// lib/logger.ts - Enhanced logging
export function logProduction(context: string, message: string, data?: any) {
  if (process.env.NODE_ENV === 'production') {
    // Send to monitoring service (e.g., Sentry, LogRocket)
    console.log(`[${new Date().toISOString()}] [${context}] ${message}`, data);
  }
}
```

#### **Health Check Endpoint:**
```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Test external services
    const services = {
      database: 'healthy',
      email: process.env.RESEND_API_KEY ? 'configured' : 'missing',
      payments: process.env.PAYSTACK_SECRET_KEY ? 'configured' : 'missing'
    };
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message
    }, { status: 500 });
  }
}
```

### **Performance Monitoring**

#### **Key Metrics to Monitor:**
- Database connection pool usage
- API response times
- Error rates by endpoint
- Payment success rates
- Email delivery rates
- User registration/login success rates

#### **Set up Alerts:**
- Database connection failures
- High error rates (>5%)
- Payment processing failures
- Email delivery failures
- Application crashes

## 🔄 **Rollback Strategy**

### **Database Rollback:**
```bash
# If database migration fails
pg_restore -h your-db-host -U your-user -d your-db backup-YYYYMMDD-HHMMSS.sql
```

### **Application Rollback:**

#### **Vercel:**
1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "Promote to Production"

#### **Manual Server:**
```bash
# Revert to previous commit
git checkout previous-working-commit
npm ci
npm run build
pm2 restart your-app-name
```

### **Emergency Rollback:**
```bash
# Quick rollback script
#!/bin/bash
echo "🚨 Emergency rollback initiated..."
git checkout main~1
npm ci
npm run build
pm2 restart your-app-name
echo "✅ Rollback completed"
```

## 🛡️ **Security Best Practices**

### **Environment Security:**
- [ ] All secrets stored in environment variables
- [ ] No hardcoded credentials in code
- [ ] Database credentials rotated regularly
- [ ] API keys are production keys
- [ ] HTTPS enforced everywhere

### **Application Security:**
- [ ] Input validation on all API endpoints
- [ ] Rate limiting implemented
- [ ] CORS properly configured
- [ ] Authentication tokens properly secured
- [ ] SQL injection prevention (Prisma handles this)

### **Infrastructure Security:**
- [ ] Database access restricted to application servers
- [ ] Firewall rules configured
- [ ] SSL certificates valid and auto-renewing
- [ ] Regular security updates applied

## 📈 **Performance Optimization**

### **Database Optimization:**
```sql
-- Add indexes for better performance
CREATE INDEX CONCURRENTLY idx_bookings_client_id ON bookings(client_id);
CREATE INDEX CONCURRENTLY idx_bookings_provider_id ON bookings(provider_id);
CREATE INDEX CONCURRENTLY idx_bookings_status ON bookings(status);
CREATE INDEX CONCURRENTLY idx_payments_booking_id ON payments(booking_id);
```

### **Application Optimization:**
- Enable Next.js production optimizations
- Use CDN for static assets
- Implement caching strategies
- Optimize database queries
- Use connection pooling

## 🚨 **Troubleshooting Guide**

### **Common Issues:**

#### **Database Connection Errors:**
```bash
# Check database connectivity
psql -h your-db-host -U your-user -d your-db -c "SELECT 1"

# Verify environment variables
echo $DATABASE_URL
```

#### **Build Failures:**
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm ci
npm run build
```

#### **Environment Variable Issues:**
```bash
# Verify all required variables are set
node -e "
const required = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'JWT_SECRET'];
required.forEach(key => {
  if (!process.env[key]) {
    console.error('❌ Missing:', key);
  } else {
    console.log('✅ Found:', key);
  }
});
"
```

## 📋 **Deployment Checklist**

### **Pre-Deployment:**
- [ ] Code reviewed and tested
- [ ] Database migrations prepared
- [ ] Environment variables configured
- [ ] Backup created
- [ ] Rollback plan ready

### **During Deployment:**
- [ ] Deploy to staging first (if available)
- [ ] Run database migrations
- [ ] Deploy application
- [ ] Verify deployment

### **Post-Deployment:**
- [ ] Health checks passing
- [ ] Core functionality tested
- [ ] Monitoring alerts configured
- [ ] Documentation updated
- [ ] Team notified

---

## 🎯 **Success Metrics**

**Deployment is successful when:**
- ✅ All health checks pass
- ✅ Database connection stable
- ✅ API endpoints responding correctly
- ✅ User flows work end-to-end
- ✅ Payment processing functional
- ✅ Email notifications working
- ✅ Admin dashboard accessible
- ✅ No critical errors in logs
- ✅ Performance metrics within acceptable ranges

---

**Status**: ✅ **DEPLOYMENT GUIDE COMPLETE** | 🚀 **READY FOR PRODUCTION**
**Priority**: High (ensures smooth, reliable deployments)
**Impact**: Professional-grade deployment process with monitoring and rollback capabilities
