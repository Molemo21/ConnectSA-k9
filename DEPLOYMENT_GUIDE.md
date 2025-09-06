# Production Deployment Guide

This guide covers the complete process for deploying ConnectSA to staging and production environments.

## Prerequisites

### Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@host:6543/database?pgbouncer=true&connect_timeout=10&pool_timeout=60&connection_limit=5
DIRECT_URL=postgresql://user:password@host:5432/database?sslmode=require
PRISMA_DISABLE_PREPARED_STATEMENTS=true

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-here
JWT_EXPIRES_IN=7d
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=https://your-domain.com

# Email Service (Resend)
RESEND_API_KEY=re_your-resend-api-key
FROM_EMAIL=no-reply@your-domain.com

# Payment Service (Paystack)
PAYSTACK_SECRET_KEY=sk_live_your-production-secret-key
PAYSTACK_PUBLIC_KEY=pk_live_your-production-public-key
PAYSTACK_TEST_MODE=false
PAYSTACK_WEBHOOK_URL=https://your-domain.com/api/webhooks/paystack

# App Configuration
NODE_ENV=production
```

### Database Setup

1. **Create PostgreSQL Database**: Set up a PostgreSQL database (recommended: Supabase, AWS RDS, or DigitalOcean)
2. **Configure Connection Pooling**: Use a connection pooler like PgBouncer for production
3. **Set Direct Connection**: Ensure direct connection is available for migrations

### Domain & DNS

1. **Domain Setup**: Configure your domain to point to your hosting service
2. **Email DNS**: Set up SPF, DKIM, and DMARC records for your domain
3. **SSL Certificate**: Ensure HTTPS is configured (handled automatically by most hosting platforms)

## Deployment Process

### 1. Staging Deployment

```bash
# Set staging environment variables
export NODE_ENV=staging
export DATABASE_URL=your-staging-database-url
export DIRECT_URL=your-staging-direct-url
# ... other staging variables

# Run staging deployment
chmod +x scripts/deploy-staging.sh
./scripts/deploy-staging.sh
```

**Staging Checklist:**
- [ ] Database migrations applied
- [ ] Admin user created (`admin@proliinkconnect.co.za`)
- [ ] Service categories seeded
- [ ] Unit tests passing
- [ ] Application builds successfully
- [ ] Smoke tests passing

### 2. Production Deployment

```bash
# Set production environment variables
export NODE_ENV=production
export DATABASE_URL=your-production-database-url
export DIRECT_URL=your-production-direct-url
# ... other production variables

# Run production deployment
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh
```

**Production Checklist:**
- [ ] All environment variables configured
- [ ] Database connectivity verified
- [ ] Migrations applied successfully
- [ ] Database seeded with admin user
- [ ] Smoke tests passing
- [ ] Application builds successfully
- [ ] Admin password changed from default
- [ ] Paystack keys are production keys
- [ ] Email service configured and tested

## Post-Deployment Tasks

### 1. Security Setup

```bash
# Change admin password immediately
# Access admin panel at: https://your-domain.com/admin
# Or update directly in database:

# Connect to database and update admin password
npx prisma studio
# Navigate to users table, find admin user, update password hash
```

### 2. Verify Services

#### Database Health
```bash
# Test database connectivity
npm run test:db

# Check database schema
npx prisma db pull
```

#### Email Service
```bash
# Test email sending
npm run test:email-verification
```

#### Payment Service
```bash
# Test payment integration
npm run test:payment-flow
```

### 3. Monitor Application

#### Health Check Endpoints
- `GET /api/connection/diagnostics` - Database and service health
- `GET /api/services` - Available services
- `GET /api/auth/health` - Authentication service status

#### Log Monitoring
Monitor application logs for:
- Database connection errors
- Payment processing errors
- Email sending failures
- Authentication issues

## Environment-Specific Configurations

### Vercel Deployment

1. **Environment Variables**: Set all variables in Vercel dashboard
2. **Build Command**: `npm run build`
3. **Output Directory**: `.next`
4. **Install Command**: `npm ci`

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Manual Server Deployment

```bash
# On your server
git clone your-repo
cd your-repo
npm ci
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run build
npm start
```

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check database connectivity
npm run test:db

# Verify connection strings
echo $DATABASE_URL
echo $DIRECT_URL
```

#### Migration Failures
```bash
# Reset migrations (CAUTION: This will lose data)
npx prisma migrate reset

# Or apply migrations manually
npx prisma migrate deploy
```

#### Build Failures
```bash
# Clear cache and rebuild
npm run clean
npm ci
npm run build
```

#### Email Issues
```bash
# Check Resend configuration
echo $RESEND_API_KEY
echo $FROM_EMAIL

# Test email sending
npm run test:email-verification
```

### Recovery Procedures

#### Database Recovery
```bash
# Restore from backup
pg_restore -d your_database backup_file.sql

# Re-run migrations
npx prisma migrate deploy

# Re-seed database
npx prisma db seed
```

#### Application Recovery
```bash
# Rollback to previous version
git checkout previous-stable-tag

# Rebuild and restart
npm ci
npm run build
npm start
```

## Security Considerations

### Production Security Checklist

- [ ] Admin password changed from default
- [ ] JWT secrets are cryptographically secure
- [ ] Database credentials are secure
- [ ] API keys are production keys
- [ ] HTTPS is enforced
- [ ] Rate limiting is configured
- [ ] CORS is properly configured
- [ ] Environment variables are not exposed
- [ ] Database backups are configured
- [ ] Monitoring and alerting are set up

### Regular Maintenance

- **Weekly**: Check application logs for errors
- **Monthly**: Review database performance and cleanup
- **Quarterly**: Update dependencies and security patches
- **Annually**: Review and rotate API keys and secrets

## Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test database connectivity
4. Review this guide
5. Contact development team if issues persist

---

**Remember**: Always test deployments in staging first before deploying to production!
