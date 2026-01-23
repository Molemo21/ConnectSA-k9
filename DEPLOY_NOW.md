# 🚀 Deploy User Deletion System - Quick Start

## ⚡ Quick Deployment

### Option 1: Development Deployment

**Step 1: Set DATABASE_URL**
```bash
# For development database
export DATABASE_URL="postgresql://user:password@localhost:5432/connectsa"
export DIRECT_URL="postgresql://user:password@localhost:5432/connectsa"

# Or add to .env file:
echo 'DATABASE_URL="postgresql://user:password@localhost:5432/connectsa"' >> .env
echo 'DIRECT_URL="postgresql://user:password@localhost:5432/connectsa"' >> .env
```

**Step 2: Deploy**
```bash
npm run deploy:user-deletion
```

This will:
1. ✅ Verify implementation
2. ✅ Generate Prisma client
3. ✅ Apply migration
4. ✅ Verify migration

### Option 2: Production Deployment

**For Production (CI/CD):**
```bash
# Your existing deployment command handles everything:
npm run deploy

# Which automatically:
# 1. Runs predeploy verification
# 2. Creates database backup
# 3. Deploys migration
```

**For Manual Production (if needed):**
```bash
# Set environment
export NODE_ENV=production
export CI=true
export DATABASE_URL="your-production-database-url"
export DIRECT_URL="your-production-direct-url"

# Deploy
npm run deploy:user-deletion:prod
```

## 📋 Pre-Deployment Checklist

- [ ] DATABASE_URL is set
- [ ] DIRECT_URL is set (for migrations)
- [ ] Database is accessible
- [ ] Backup strategy confirmed (for production)

## ✅ Post-Deployment Verification

```sql
-- Verify column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'deletedAt';

-- Verify index exists
SELECT indexname FROM pg_indexes 
WHERE tablename = 'users' AND indexname LIKE '%deletedAt%';
```

## 🆘 Troubleshooting

### DATABASE_URL Not Set
```bash
# Check if .env file exists
ls -la .env

# Create from example
cp env.example .env

# Edit .env and add your DATABASE_URL
```

### Migration Fails
```bash
# Check migration status
npx prisma migrate status

# Check for empty migration directories
ls -la prisma/migrations/
```

### Connection Issues
```bash
# Test connection
node -e "const { prisma } = require('./lib/prisma'); prisma.\$queryRaw\`SELECT 1\`.then(() => console.log('✅ Connected')).catch(e => console.error('❌ Failed:', e.message));"
```

## 🎯 Success Indicators

Deployment is successful when:
- ✅ Migration applied without errors
- ✅ `deletedAt` column exists
- ✅ Index created
- ✅ No errors in logs

---

**Ready to deploy?** Set DATABASE_URL and run: `npm run deploy:user-deletion`
