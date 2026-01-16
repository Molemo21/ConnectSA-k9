# Environment Separation Guide

## Overview

This project uses **separate databases** for development, staging, and production to prevent accidental data loss and ensure safe development practices.

## 🎯 Key Principles

1. **Development** should NEVER connect to production database
2. **Production** should NEVER use development database
3. **Migrations** should only run on the correct environment
4. **Tests** should use a disposable test database

## 📁 Environment Files

Next.js automatically loads environment files based on `NODE_ENV`:

### Loading Order (highest to lowest priority):
1. `.env.local` - Always loaded, highest priority (git-ignored)
2. `.env.development` / `.env.production` / `.env.test` - Based on `NODE_ENV`
3. `.env` - Fallback, always loaded

### Environment File Templates

We provide example templates (do NOT commit actual credentials):

- **`env.development.example`** - Template for local development
- **`env.production.example`** - Template for production (use platform env vars in production)
- **`env.test.example`** - Template for automated testing

### Setting Up Environment Files

#### Development Setup

1. Copy the development template:
   ```bash
   cp env.development.example .env.development
   ```

2. Edit `.env.development` with your local database:
   ```bash
   DATABASE_URL="postgresql://connectsa:connectsa@127.0.0.1:5432/connectsa_dev"
   DIRECT_URL="postgresql://connectsa:connectsa@127.0.0.1:5432/connectsa_dev"
   NODE_ENV=development
   ```

3. Start development server:
   ```bash
   npm run dev
   # Next.js will automatically load .env.development
   ```

#### Production Setup

**⚠️ IMPORTANT**: For production deployments (Vercel, etc.), **DO NOT** use `.env` files. Instead, set environment variables in your hosting platform's dashboard.

1. **Vercel**: Go to Project Settings → Environment Variables
2. **Other platforms**: Use their environment variable configuration

Set these variables:
```bash
NODE_ENV=production
DATABASE_URL=your-production-database-url
DIRECT_URL=your-production-direct-url
# ... other production variables
```

#### Test Setup

1. Copy the test template:
   ```bash
   cp env.test.example .env.test
   ```

2. Edit `.env.test` with your test database:
   ```bash
   DATABASE_URL="postgresql://test:test@localhost:5432/connectsa_test"
   DIRECT_URL="postgresql://test:test@localhost:5432/connectsa_test"
   NODE_ENV=test
   ```

3. Run tests:
   ```bash
   NODE_ENV=test npm test
   ```

## 🛡️ Safety Features

### Automatic Safety Checks

The application includes automatic safety checks that:

1. **Block** if development connects to production database (unless `ALLOW_PROD_DB=true`)
2. **Block** if production tries to use development database
3. **Validate** environment configuration on startup
4. **Block** Prisma CLI commands from running on production database from dev environment
5. **Block** migrations on production database from development environment

### Safety Check Behavior

- **Development/Test → Production DB**: 🚨 **BLOCKED** (unless `ALLOW_PROD_DB=true`)
- **Production → Development DB**: 🚨 **BLOCKED** (always)
- **Migrations on Production from Dev**: 🚨 **BLOCKED** (unless `--force` flag or `ALLOW_PROD_DB=true`)
- **Prisma CLI Commands**: 🚨 **BLOCKED** from accessing production DB in dev (unless `ALLOW_PROD_DB=true`)

### Example Safety Errors (Blocking)

```
🚨 BLOCKED: Development/Test cannot connect to production database
================================================================================
Environment: DEVELOPMENT
Database URL: postgresql://postgres:...@aws-0-eu-west-1.pooler.supabase.com...

This connection is BLOCKED for safety to prevent accidental data loss.

To override this safety check (NOT RECOMMENDED):
  Set ALLOW_PROD_DB=true in your environment

Recommended solution:
  Create a separate development database and update DATABASE_URL
  See ENVIRONMENT_SEPARATION.md for setup instructions
================================================================================
```

## 🔧 Migration Guidelines

### Development Migrations

```bash
# Create a new migration
NODE_ENV=development npm run db:migrate

# Or explicitly
NODE_ENV=development npx prisma migrate dev
```

### Production Migrations

**⚠️ CRITICAL**: Only run production migrations from production environment or with explicit confirmation.

```bash
# In production environment
NODE_ENV=production npx prisma migrate deploy

# If you must run from development (NOT RECOMMENDED)
node scripts/migrate-db.js <command> --force
```

### Migration Safety

The migration script will:
- ✅ Warn if running on production DB from dev environment
- ✅ Block if production tries to use dev database
- ✅ Allow `--force` flag for intentional operations

## 📊 Database Configuration

### Development Database

**Recommended**: Use a local PostgreSQL instance or a separate Supabase dev project.

```bash
# Local PostgreSQL (recommended)
DATABASE_URL="postgresql://connectsa:connectsa@127.0.0.1:5432/connectsa_dev"

# Or separate Supabase dev project
DATABASE_URL="postgresql://postgres:password@your-dev-project.pooler.supabase.com:6543/postgres"
```

### Production Database

Use your production Supabase database:

```bash
DATABASE_URL="postgresql://postgres:password@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:password@aws-0-eu-west-1.supabase.com:5432/postgres?sslmode=require"
```

### Test Database

Use a disposable test database:

```bash
DATABASE_URL="postgresql://test:test@localhost:5432/connectsa_test"
```

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] Verify `NODE_ENV=production` is set
- [ ] Verify production `DATABASE_URL` is set (not development)
- [ ] Verify all required environment variables are set
- [ ] Test production build locally: `NODE_ENV=production npm run build`

### Production Deployment

- [ ] Set environment variables in hosting platform (Vercel, etc.)
- [ ] Verify database safety checks pass
- [ ] Run migrations: `NODE_ENV=production npx prisma migrate deploy`
- [ ] Verify application starts successfully

### Post-Deployment

- [ ] Verify application connects to production database
- [ ] Verify no development database connections
- [ ] Monitor logs for safety warnings

## 🔍 Troubleshooting

### "Development environment cannot connect to production database" Error

**Problem**: Development environment is blocked from connecting to production database.

**Solution**: Create a `.env.development` file with a development database URL.

```bash
# Create .env.development
cp env.development.example .env.development
# Edit with your dev database URL (NOT production URL)
```

**If you absolutely must connect to production from development** (NOT RECOMMENDED):
```bash
ALLOW_PROD_DB=true npm run dev
# Or set it in your .env.development file (NOT RECOMMENDED)
```

### "Production environment using development database" Error

**Solution**: Set correct `DATABASE_URL` in your production environment (Vercel dashboard, etc.).

### Migration Safety Errors (Blocked)

**If you need to run migrations on production from development** (NOT RECOMMENDED):

Option 1: Use `--force` flag:
```bash
node scripts/migrate-db.js <command> --force
```

Option 2: Set `ALLOW_PROD_DB=true`:
```bash
ALLOW_PROD_DB=true node scripts/migrate-db.js <command>
```

**Recommended**: Run migrations from production environment or use a separate development database.

## 📚 Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Prisma Environment Variables](https://www.prisma.io/docs/guides/development-environment/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

## 🆘 Getting Help

If you encounter issues:

1. Check environment file configuration
2. Verify `NODE_ENV` is set correctly
3. Review safety warnings/errors in console
4. Check database connection strings
5. Review this documentation

## 🔓 Opt-Out Mechanism (NOT RECOMMENDED)

**⚠️ WARNING**: The opt-out mechanism should ONLY be used in exceptional circumstances.

If you absolutely must override the safety checks, set `ALLOW_PROD_DB=true`:

```bash
# Temporarily override for a single command
ALLOW_PROD_DB=true npm run dev

# Or set in environment file (NOT RECOMMENDED)
# .env.development
ALLOW_PROD_DB=true
```

**When to use**: Only for emergency database access or troubleshooting, never for regular development.

**Consequences**: 
- ⚠️ Can cause accidental data loss
- ⚠️ Can accidentally modify production schema
- ⚠️ Can corrupt production data
- ⚠️ Violates development best practices

**Best Practice**: Always use a separate development database instead.

## ✅ Safety Checklist

Before starting development:

- [ ] `.env.development` file exists with dev database
- [ ] Production credentials are NOT in development files
- [ ] `NODE_ENV` is set correctly
- [ ] Database safety checks are passing (connections will be blocked if unsafe)
- [ ] No hardcoded database URLs in code
- [ ] `ALLOW_PROD_DB` is NOT set (unless absolutely necessary)

Before deploying to production:

- [ ] Environment variables set in hosting platform (Vercel, etc.)
- [ ] `NODE_ENV=production` is set
- [ ] Production `DATABASE_URL` is correct
- [ ] No development database URLs in production config
- [ ] All safety checks pass
- [ ] `ALLOW_PROD_DB` is NOT set in production environment

---

**Remember**: When in doubt, use a separate database for development. It's better to be safe than sorry! 🛡️

