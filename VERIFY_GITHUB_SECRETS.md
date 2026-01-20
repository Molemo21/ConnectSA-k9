# Verify GitHub Secrets for Production Deployment

## Required Secrets

The production deployment workflow requires these secrets to be set in GitHub:

### 1. DATABASE_URL
- **Purpose**: Main database connection (uses connection pooler)
- **Format**: `postgresql://user:password@host:6543/database?pgbouncer=true&...`
- **Port**: 6543 (connection pooler)
- **Hostname**: Should contain `pooler` (e.g., `aws-X-eu-west-1.pooler.supabase.com`)

### 2. DIRECT_URL ⚠️ CRITICAL
- **Purpose**: Direct database connection for migrations (bypasses pooler)
- **Format**: `postgresql://user:password@host:5432/database?sslmode=require`
- **Port**: 5432 (direct connection)
- **Hostname**: Should NOT contain `pooler` (e.g., `aws-X-eu-west-1.supabase.com`)
- **Why**: Prisma migrations require direct connection, not through pgbouncer

### 3. PROD_DATABASE_URL
- **Purpose**: Production database URL (used by fix-production-services script)
- **Format**: Can be same as DATABASE_URL or a separate production URL
- **Note**: If not set, falls back to DATABASE_URL

### 4. DEV_DATABASE_URL (Optional)
- **Purpose**: Development database URL (for reference data promotion)
- **Format**: Development database connection string
- **Note**: Only needed if you want to promote reference data from dev to prod

### 5. NEXTAUTH_SECRET
- **Purpose**: NextAuth.js secret for session encryption
- **Format**: Random string (minimum 32 characters)

### 6. JWT_SECRET
- **Purpose**: JWT token signing secret
- **Format**: Random string (minimum 32 characters)

## How to Verify Secrets

### Step 1: Go to GitHub Secrets
1. Navigate to: https://github.com/Molemo21/ConnectSA-k9/settings/secrets/actions
2. You should see all the secrets listed

### Step 2: Check DIRECT_URL Format ⚠️ MOST IMPORTANT

**Correct Format:**
```
postgresql://postgres.xxx:password@aws-X-eu-west-1.supabase.com:5432/postgres?sslmode=require
```
- ✅ Port: 5432
- ✅ Hostname: `aws-X-eu-west-1.supabase.com` (NO "pooler")
- ✅ Has `?sslmode=require` or similar SSL parameter

**Incorrect Format:**
```
postgresql://postgres.xxx:password@aws-X-eu-west-1.pooler.supabase.com:5432/postgres
```
- ❌ Hostname contains "pooler"
- ❌ This will cause "prepared statement does not exist" errors

### Step 3: Check DATABASE_URL Format

**Correct Format:**
```
postgresql://postgres.xxx:password@aws-X-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&...
```
- ✅ Port: 6543 (connection pooler)
- ✅ Hostname: Contains "pooler"
- ✅ Has `?pgbouncer=true` parameter

### Step 4: Verify PROD_DATABASE_URL

- Should point to your production database
- Can be same as DATABASE_URL if you only have one production database
- Used by the `fix-production-services` script

## How to Get Correct DIRECT_URL from Supabase

1. Go to your Supabase project dashboard
2. Navigate to: **Settings** → **Database**
3. Find **Connection string** section
4. Select **Direct connection** (NOT "Connection pooling")
5. Copy the connection string
6. It should look like:
   ```
   postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-X-eu-west-1.supabase.com:5432/postgres
   ```
7. Replace `[YOUR-PASSWORD]` with your actual database password
8. Add `?sslmode=require` if not present

## Quick Verification Checklist

- [ ] `DIRECT_URL` exists in GitHub Secrets
- [ ] `DIRECT_URL` uses port 5432
- [ ] `DIRECT_URL` hostname does NOT contain "pooler"
- [ ] `DATABASE_URL` exists in GitHub Secrets
- [ ] `DATABASE_URL` uses port 6543 (pooler)
- [ ] `PROD_DATABASE_URL` exists (or DATABASE_URL is production)
- [ ] `NEXTAUTH_SECRET` exists and is at least 32 characters
- [ ] `JWT_SECRET` exists and is at least 32 characters

## Common Issues

### Issue 1: "prepared statement does not exist" error
**Cause**: DIRECT_URL is using pooler connection
**Fix**: Update DIRECT_URL to use direct connection (no "pooler" in hostname, port 5432)

### Issue 2: Migration status check fails
**Cause**: DIRECT_URL not set or incorrect
**Fix**: Ensure DIRECT_URL is set correctly (see format above)

### Issue 3: Services not being fixed
**Cause**: PROD_DATABASE_URL not set or pointing to wrong database
**Fix**: Set PROD_DATABASE_URL to your production database URL

## Testing

After updating secrets, trigger a workflow run:
1. Go to: https://github.com/Molemo21/ConnectSA-k9/actions/workflows/deploy-production.yml
2. Click "Run workflow"
3. Select branch: `main`
4. Click "Run workflow"
5. Check the "Pre-deployment Verification" job - it should pass if DIRECT_URL is correct
