# Database Credential Rotation Guide

**Purpose**: Secure procedure for rotating database credentials after security changes or on a regular schedule.

**Security Requirement**: Rotate all database passwords immediately after implementing new role structure.

---

## Pre-Rotation Checklist

Before rotating credentials:

- [ ] Backup database
- [ ] Document current connection strings
- [ ] Notify team of rotation schedule
- [ ] Prepare new passwords (use strong password generator)
- [ ] Update all environment variables/secrets
- [ ] Test new credentials in staging first

---

## Step-by-Step Rotation Procedure

### Step 1: Generate New Passwords

Use a secure password generator. Requirements:
- Minimum 32 characters
- Mix of uppercase, lowercase, numbers, symbols
- Unique for each user
- Store securely (password manager)

**Example** (DO NOT USE - generate your own):
```
connectsa_app_user:        Ab7$kL9mN2pQ4rS6tU8vW0xY1zA3bC5dE7fG9hI
connectsa_migration_user:  Xy9$wV4uT2sR6qP8oN0mL2kJ4iH6gF8eD0cB2aZ
connectsa_dev_user:        Mn5$pL3oK1jI9hG7fE5dC3bA1zY9xW7vU5tS3rQ
```

---

### Step 2: Update Database Passwords

**⚠️ CRITICAL**: Update passwords in this order to minimize downtime:

#### 2.1 Update Application User (During Low Traffic)

```sql
-- Connect as superuser
ALTER USER connectsa_app_user WITH PASSWORD 'new_secure_password_here';
```

**Action Required**: Update `DATABASE_URL` in production environment immediately after.

#### 2.2 Update Migration User

```sql
ALTER USER connectsa_migration_user WITH PASSWORD 'new_secure_password_here';
```

**Action Required**: Update `MIGRATION_DATABASE_URL` in CI/CD secrets.

#### 2.3 Update Developer User

```sql
ALTER USER connectsa_dev_user WITH PASSWORD 'new_secure_password_here';
```

**Action Required**: Update `DEV_READONLY_DATABASE_URL` and notify developers.

---

### Step 3: Update Environment Variables

#### 3.1 Production Application (Vercel/Production Host)

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Update `DATABASE_URL`:
   ```
   postgresql://connectsa_app_user:NEW_PASSWORD@host:port/database
   ```
3. Redeploy application (or wait for next deployment)

#### 3.2 CI/CD (GitHub Actions)

1. Go to GitHub Repository → Settings → Secrets and variables → Actions
2. Update `MIGRATION_DATABASE_URL`:
   ```
   postgresql://connectsa_migration_user:NEW_PASSWORD@host:port/database
   ```
3. Test with a non-production migration

#### 3.3 Developer Access

1. Update shared password manager entry
2. Notify authorized developers
3. Provide new `DEV_READONLY_DATABASE_URL`

---

### Step 4: Verify New Credentials

#### 4.1 Test Application Connection

```bash
# Test application user
psql "postgresql://connectsa_app_user:NEW_PASSWORD@host:port/database" -c "SELECT current_user;"
# Expected: connectsa_app_user
```

#### 4.2 Test Migration Connection

```bash
# Test migration user (in CI/CD)
DATABASE_URL="postgresql://connectsa_migration_user:NEW_PASSWORD@host:port/database" npm run db:migrate:deploy --dry-run
```

#### 4.3 Test Developer Connection

```bash
# Test developer user
psql "postgresql://connectsa_dev_user:NEW_PASSWORD@host:port/database" -c "SELECT current_user;"
# Expected: connectsa_dev_user

# Verify read-only
psql "postgresql://connectsa_dev_user:NEW_PASSWORD@host:port/database" -c "INSERT INTO users (id, email) VALUES ('test', 'test');"
# Expected: Permission denied
```

---

### Step 5: Revoke Old Credentials (Optional)

After confirming all systems work with new credentials:

```sql
-- Optionally expire old passwords (forces immediate update)
ALTER USER connectsa_app_user VALID UNTIL 'infinity';
ALTER USER connectsa_migration_user VALID UNTIL 'infinity';
ALTER USER connectsa_dev_user VALID UNTIL 'infinity';
```

---

## Emergency Rotation Procedure

If credentials are compromised:

1. **Immediately** rotate all passwords
2. Revoke all active sessions:
   ```sql
   SELECT pg_terminate_backend(pid) 
   FROM pg_stat_activity 
   WHERE usename IN ('connectsa_app_user', 'connectsa_migration_user', 'connectsa_dev_user');
   ```
3. Update all environment variables
4. Force application restart
5. Audit access logs for unauthorized access
6. Notify security team

---

## Rotation Schedule

**Recommended Frequency**:
- **Application User**: Every 90 days
- **Migration User**: Every 180 days (or after security incidents)
- **Developer User**: Every 90 days (or when team members change)

**Triggers for Immediate Rotation**:
- Security incident
- Team member departure
- Credential exposure
- After implementing new role structure (IMMEDIATE)

---

## Post-Rotation Verification

After rotation, verify:

- [ ] Application can connect and operate normally
- [ ] CI/CD migrations can run successfully
- [ ] Developers can access read-only connection
- [ ] Old credentials no longer work
- [ ] All environment variables updated
- [ ] No connection errors in logs
- [ ] Application functionality verified

---

## Password Storage

### Secure Storage Locations

✅ **DO Store Passwords In**:
- Password managers (1Password, LastPass, Bitwarden)
- CI/CD secrets (GitHub Secrets, Vercel Environment Variables)
- Secure vaults (HashiCorp Vault, AWS Secrets Manager)
- Encrypted configuration files (with proper access control)

❌ **DO NOT Store Passwords In**:
- Git repositories
- Code files
- Documentation (unless encrypted)
- Shared documents
- Email
- Slack/chat applications

---

## Connection String Format

### Application Runtime

```
postgresql://connectsa_app_user:PASSWORD@host:port/database?sslmode=require
```

### Migration (CI/CD)

```
postgresql://connectsa_migration_user:PASSWORD@host:port/database?sslmode=require
```

### Developer Read-Only

```
postgresql://connectsa_dev_user:PASSWORD@host:port/database?sslmode=require
```

---

## Troubleshooting

### Issue: Application cannot connect after rotation

**Check**:
1. Password correctly set in database
2. `DATABASE_URL` updated in environment
3. Application restarted/redeployed
4. No typos in connection string

### Issue: Migrations fail after rotation

**Check**:
1. `MIGRATION_DATABASE_URL` updated in CI/CD secrets
2. Migration user has correct role
3. CI/CD pipeline uses updated variable

### Issue: Developer cannot connect

**Check**:
1. Password correctly set
2. User has correct role (`connectsa_dev_readonly`)
3. Connection string format is correct
4. Network/firewall allows connection

---

## Compliance Notes

### Audit Trail

Document all rotations:
- Date and time
- Who performed rotation
- Reason for rotation
- Verification results
- Any issues encountered

### Access Logs

Review access logs after rotation:
- Failed authentication attempts
- Successful connections
- Permission denials
- Unusual access patterns

---

## Quick Reference

### Rotation Command Template

```sql
-- Application user
ALTER USER connectsa_app_user WITH PASSWORD 'NEW_PASSWORD';

-- Migration user  
ALTER USER connectsa_migration_user WITH PASSWORD 'NEW_PASSWORD';

-- Developer user
ALTER USER connectsa_dev_user WITH PASSWORD 'NEW_PASSWORD';
```

### Verification Command Template

```bash
# Test connection
psql "postgresql://USER:PASSWORD@HOST:PORT/DATABASE" -c "SELECT current_user;"
```

---

**Status**: ✅ **READY FOR USE**  
**Last Updated**: $(date)  
**Next Rotation Due**: $(date +90 days)
