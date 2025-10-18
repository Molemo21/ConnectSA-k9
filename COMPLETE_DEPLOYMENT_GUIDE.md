# 🚀 Complete Production Deployment Guide - Best Practices

## 📋 **Quick Start Commands**

### **Environment Setup**
```bash
# Create production environment template
npm run env:create production

# Validate environment configuration
npm run env:validate production

# Generate secure production secrets
npm run env:generate-secrets

# Security check
npm run env:security-check production
```

### **Database Operations**
```bash
# Create database backup
npm run db:backup "Before production deployment"

# Validate database schema
npm run db:validate

# Run full migration with backup
npm run db:full-migrate "Production deployment"

# Clean up old backups
npm run db:cleanup 7
```

### **Deployment**
```bash
# Full production deployment
npm run deploy:production

# Skip tests (faster deployment)
npm run deploy:production:skip-tests

# Verify deployment
npm run verify:production https://your-domain.com
```

### **Monitoring & Rollback**
```bash
# Start continuous monitoring
npm run monitor:start https://your-domain.com

# Check current status
npm run monitor:status

# Generate monitoring report
npm run monitor:report

# List rollback points
npm run rollback:points

# Emergency rollback
npm run rollback:emergency
```

## 🔧 **Step-by-Step Deployment Process**

### **Phase 1: Pre-Deployment Preparation**

#### **1. Environment Configuration**
```bash
# Step 1: Create production environment template
npm run env:create production

# Step 2: Update .env.production with your actual values
# Edit .env.production file with:
# - Your production database URL
# - Secure JWT secrets
# - Production API keys
# - Correct domain URLs

# Step 3: Validate configuration
npm run env:validate production

# Step 4: Security check
npm run env:security-check production
```

#### **2. Database Preparation**
```bash
# Step 1: Create backup
npm run db:backup "Pre-deployment backup"

# Step 2: Validate current schema
npm run db:validate

# Step 3: Test database connection
npm run db:sync
```

#### **3. Code Quality Checks**
```bash
# Run all tests
npm run test:all

# Build application
npm run build

# Lint code
npm run lint
```

### **Phase 2: Deployment Execution**

#### **1. Automated Deployment**
```bash
# Full deployment with all checks
npm run deploy:production

# Or skip tests for faster deployment
npm run deploy:production:skip-tests
```

#### **2. Manual Deployment (Alternative)**
```bash
# For manual server deployment
git pull origin main
npm ci --production
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart your-app-name
```

### **Phase 3: Post-Deployment Verification**

#### **1. Automated Verification**
```bash
# Comprehensive verification
npm run verify:production https://your-domain.com

# Health check
npm run health:check
```

#### **2. Manual Testing**
- [ ] Homepage loads: `https://your-domain.com`
- [ ] API health: `https://your-domain.com/api/health`
- [ ] User registration works
- [ ] User login works
- [ ] Booking flow complete end-to-end
- [ ] Payment processing works
- [ ] Admin dashboard accessible

### **Phase 4: Monitoring Setup**

#### **1. Start Monitoring**
```bash
# Start continuous monitoring
npm run monitor:start https://your-domain.com
```

#### **2. Monitor Key Metrics**
- Database connection health
- API response times
- Error rates
- Payment success rates
- User registration/login success

## 💳 **Payment Configuration (Test Mode)**

### **Current Setup: Test Payments**
Your deployment is configured for **test payments** which is perfect for development and initial production testing. Here's what you need to know:

```bash
# Test Payment Configuration (Current)
PAYSTACK_SECRET_KEY="sk_test_your-test-secret-key"
PAYSTACK_PUBLIC_KEY="pk_test_your-test-public-key"
PAYSTACK_TEST_MODE=true
```

### **Test Payment Benefits:**
- ✅ **No real money transactions** - safe for testing
- ✅ **Full payment flow testing** - all features work
- ✅ **Webhook testing** - complete integration testing
- ✅ **User experience testing** - real payment UI/UX

### **When Ready for Live Payments:**
```bash
# Live Payment Configuration (When Ready)
PAYSTACK_SECRET_KEY="sk_live_your-live-secret-key"
PAYSTACK_PUBLIC_KEY="pk_live_your-live-public-key"
PAYSTACK_TEST_MODE=false
```

### **Switching to Live Payments:**
1. Get live keys from Paystack dashboard
2. Update environment variables
3. Test with small amounts first
4. Monitor payment processing closely

## 🛡️ **Security Best Practices**

### **Environment Security**
```bash
# Generate secure secrets
npm run env:generate-secrets

# Validate all environment variables
npm run env:validate production

# Check for security issues (will warn about test keys in production)
npm run env:security-check production
```

### **Required Environment Variables**
```bash
# Database
DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"
DIRECT_URL="postgresql://user:pass@host:port/db?sslmode=require"
PRISMA_DISABLE_PREPARED_STATEMENTS=true

# Authentication (minimum 32 characters)
JWT_SECRET="your-super-secure-jwt-secret-here-min-32-chars"
NEXTAUTH_SECRET="your-nextauth-secret-here-min-32-chars"
NEXTAUTH_URL="https://your-domain.com"

# Email Service
RESEND_API_KEY="re_your-production-resend-api-key"
FROM_EMAIL="no-reply@your-domain.com"

# Payment Service (Test Keys - Change to Live Keys When Ready)
PAYSTACK_SECRET_KEY="sk_test_your-test-secret-key"
PAYSTACK_PUBLIC_KEY="pk_test_your-test-public-key"
PAYSTACK_TEST_MODE=true
PAYSTACK_WEBHOOK_URL="https://your-domain.com/api/webhooks/paystack"

# App Configuration
NODE_ENV=production
COOKIE_DOMAIN=your-domain.com
LOG_LEVEL=info
```

## 🗄️ **Database Management**

### **Migration Strategy**
```bash
# Safe migration with backup
npm run db:full-migrate "Feature deployment"

# Quick migration (if you're confident)
npm run db:migrate:deploy

# Validate after migration
npm run db:validate
```

### **Backup Management**
```bash
# Create backup before changes
npm run db:backup "Before adding new features"

# Clean up old backups (keep 7 days)
npm run db:cleanup 7

# List available backups
ls -la database-backups/
```

## 📊 **Monitoring & Alerting**

### **Health Monitoring**
```bash
# Start continuous monitoring
npm run monitor:start https://your-domain.com

# Check current status
npm run monitor:status

# Generate detailed report
npm run monitor:report
```

### **Key Metrics to Monitor**
- **Database Health**: Connection status, response times
- **API Performance**: Response times, error rates
- **Payment Processing**: Success rates, failure patterns
- **User Experience**: Registration/login success rates
- **System Resources**: Memory usage, CPU utilization

### **Alert Thresholds**
- Database connection failures: Immediate alert
- API error rate > 5%: Alert after 3 consecutive checks
- Payment failure rate > 2%: Alert after 2 consecutive checks
- Response time > 5 seconds: Alert after 3 consecutive checks

## 🔄 **Rollback Procedures**

### **Emergency Rollback**
```bash
# Immediate rollback to previous working version
npm run rollback:emergency
```

### **Planned Rollback**
```bash
# List available rollback points
npm run rollback:points

# Rollback to specific commit
npm run rollback:to abc123def456
```

### **Rollback Verification**
```bash
# After rollback, verify system health
npm run verify:production https://your-domain.com

# Check monitoring status
npm run monitor:status
```

## 🚨 **Troubleshooting Guide**

### **Common Issues & Solutions**

#### **Database Connection Errors**
```bash
# Check database connectivity
npm run db:sync

# Verify environment variables
npm run env:validate production

# Test database connection manually
psql -h your-db-host -U your-user -d your-db -c "SELECT 1"
```

#### **Build Failures**
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm ci
npm run build
```

#### **Environment Variable Issues**
```bash
# Validate all environment variables
npm run env:validate production

# Check for missing variables
npm run env:security-check production

# Compare environments
npm run env:compare development production
```

#### **API Endpoint Failures**
```bash
# Check health endpoint
npm run health:check

# Verify deployment
npm run verify:production https://your-domain.com

# Check application logs
pm2 logs your-app-name
```

### **Debug Commands**
```bash
# Check Prisma client generation
npx prisma generate

# Check database schema
npx prisma db pull

# Test database operations
npm run db:validate

# Check environment configuration
npm run env:validate production
```

## 📈 **Performance Optimization**

### **Database Optimization**
```sql
-- Add performance indexes
CREATE INDEX CONCURRENTLY idx_bookings_client_id ON bookings(client_id);
CREATE INDEX CONCURRENTLY idx_bookings_provider_id ON bookings(provider_id);
CREATE INDEX CONCURRENTLY idx_bookings_status ON bookings(status);
CREATE INDEX CONCURRENTLY idx_payments_booking_id ON payments(booking_id);
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_providers_status ON providers(status);
```

### **Application Optimization**
- Enable Next.js production optimizations
- Use CDN for static assets
- Implement caching strategies
- Optimize database queries
- Use connection pooling

## 📋 **Deployment Checklist**

### **Pre-Deployment**
- [ ] Environment variables configured and validated
- [ ] Database backup created
- [ ] Code reviewed and tested
- [ ] Security check passed
- [ ] Rollback plan ready

### **During Deployment**
- [ ] Database migrations applied
- [ ] Application deployed
- [ ] Health checks passing
- [ ] Core functionality verified

### **Post-Deployment**
- [ ] Monitoring started
- [ ] Performance metrics within acceptable ranges
- [ ] No critical errors in logs
- [ ] User flows tested end-to-end
- [ ] Team notified of successful deployment

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
- ✅ Monitoring alerts configured

## 🔧 **Available Scripts Reference**

### **Environment Management**
- `npm run env:create <environment>` - Create environment template
- `npm run env:validate <environment>` - Validate environment config
- `npm run env:compare <env1> <env2>` - Compare environments
- `npm run env:generate-secrets` - Generate secure secrets
- `npm run env:security-check <environment>` - Security validation

### **Database Operations**
- `npm run db:backup [description]` - Create database backup
- `npm run db:validate` - Validate database schema
- `npm run db:full-migrate [description]` - Safe migration with backup
- `npm run db:cleanup [days]` - Clean up old backups
- `npm run db:sync` - Verify database synchronization

### **Deployment**
- `npm run deploy:production` - Full production deployment
- `npm run deploy:production:skip-tests` - Fast deployment
- `npm run verify:production <url>` - Verify deployment
- `npm run health:check` - Quick health check

### **Monitoring & Rollback**
- `npm run monitor:start <url>` - Start continuous monitoring
- `npm run monitor:status` - Get monitoring status
- `npm run monitor:report` - Generate monitoring report
- `npm run rollback:points` - List rollback points
- `npm run rollback:to <commit>` - Rollback to commit
- `npm run rollback:emergency` - Emergency rollback

---

## 🎉 **Final Deployment Command**

For a complete production deployment, run:

```bash
# Complete production deployment
npm run env:validate production && \
npm run db:backup "Production deployment" && \
npm run deploy:production && \
npm run verify:production https://your-domain.com && \
npm run monitor:start https://your-domain.com
```

This single command will:
1. Validate your environment configuration
2. Create a database backup
3. Deploy to production
4. Verify the deployment
5. Start monitoring

---

**Status**: ✅ **COMPLETE DEPLOYMENT SYSTEM** | 🚀 **PRODUCTION READY**
**Priority**: Critical (comprehensive deployment solution)
**Impact**: Professional-grade deployment process with monitoring, rollback, and best practices
