# Database Roles and Permissions Documentation

**Last Updated**: $(date)  
**Status**: ✅ **IMPLEMENTED**

---

## Executive Summary

This document describes the database role structure implemented to enforce the **Principle of Least Privilege** and prevent destructive operations from local development or unauthorized access.

**Key Principle**: Each role has only the minimum permissions necessary for its specific purpose.

---

## Role Overview

### Role Hierarchy

```
PostgreSQL Superuser (postgres)
├── connectsa_app_runtime (Application Runtime)
├── connectsa_migration (CI/CD Migrations)
└── connectsa_dev_readonly (Developer Read-Only)
```

### Role Summary Table

| Role | Purpose | Login | Permissions | Use Case |
|------|---------|-------|-------------|----------|
| `connectsa_app_runtime` | Application runtime operations | No | SELECT, INSERT, UPDATE | Production application |
| `connectsa_migration` | Database migrations | No | SELECT, INSERT, UPDATE, DELETE, ALTER, CREATE | CI/CD pipelines only |
| `connectsa_dev_readonly` | Developer debugging | No | SELECT only | Local development debugging |

---

## Detailed Role Specifications

### 1. Application Runtime Role (`connectsa_app_runtime`)

**Purpose**: Used by the production application for all runtime database operations.

**Permissions**:
- ✅ **SELECT** - Read data from all tables
- ✅ **INSERT** - Create new records
- ✅ **UPDATE** - Modify existing records
- ❌ **DELETE** - **BLOCKED** (prevents accidental data loss)
- ❌ **TRUNCATE** - **BLOCKED** (prevents bulk deletion)
- ❌ **DROP** - **BLOCKED** (prevents table deletion)
- ❌ **ALTER** - **BLOCKED** (prevents schema changes)
- ❌ **CREATE** - **BLOCKED** (prevents new table creation)

**Connection Method**:
- Via connection pooling (Supabase pooler)
- User: `connectsa_app_user` (assigned this role)
- Password: Stored in production environment variables only

**Use Cases**:
- User authentication and authorization
- Booking creation and updates
- Payment processing
- Provider management
- All application CRUD operations (except DELETE)

**Security Notes**:
- Cannot perform destructive operations
- Soft deletes should be implemented at application level (status flags)
- Hard deletes require admin intervention

---

### 2. Migration Role (`connectsa_migration`)

**Purpose**: Used exclusively by CI/CD pipelines for database schema migrations.

**Permissions**:
- ✅ **SELECT** - Read data
- ✅ **INSERT** - Create records
- ✅ **UPDATE** - Modify records
- ✅ **DELETE** - Delete records (for migration cleanup)
- ✅ **ALTER** - Modify table structure (for migrations)
- ✅ **CREATE** - Create new tables/indexes (for migrations)
- ❌ **DROP** - **BLOCKED** (prevents accidental table deletion)

**Connection Method**:
- Via CI/CD environment variables
- User: `connectsa_migration_user` (assigned this role)
- Password: Stored in CI/CD secrets only (GitHub Secrets, Vercel, etc.)

**Use Cases**:
- Running Prisma migrations
- Adding new columns
- Creating indexes
- Modifying constraints
- Data migrations

**Security Notes**:
- **ONLY** usable in CI/CD environments
- Cannot be used from local development (blocked by application security)
- DROP operations require manual admin intervention
- All migrations are logged and auditable

**Restrictions**:
- Cannot drop tables (requires admin)
- Cannot drop databases
- Cannot create/drop roles
- Cannot modify role permissions

---

### 3. Developer Read-Only Role (`connectsa_dev_readonly`)

**Purpose**: Provides read-only access for developers to debug production issues.

**Permissions**:
- ✅ **SELECT** - Read data from all tables
- ❌ **INSERT** - **BLOCKED**
- ❌ **UPDATE** - **BLOCKED**
- ❌ **DELETE** - **BLOCKED**
- ❌ **TRUNCATE** - **BLOCKED**
- ❌ **DROP** - **BLOCKED**
- ❌ **ALTER** - **BLOCKED**
- ❌ **CREATE** - **BLOCKED**

**Connection Method**:
- Via separate read-only connection string
- User: `connectsa_dev_user` (assigned this role)
- Password: Stored securely, rotated regularly

**Use Cases**:
- Debugging production issues
- Investigating data inconsistencies
- Performance analysis
- Reporting and analytics

**Security Notes**:
- Read-only access prevents accidental modifications
- Can query all tables but cannot modify data
- Access should be granted on a need-to-know basis
- All access should be logged

---

## User Accounts

### Application User (`connectsa_app_user`)

- **Role**: `connectsa_app_runtime`
- **Login**: Yes
- **Password**: Set via environment variable in production
- **Connection String**: Used in `DATABASE_URL` for application
- **Access**: Production runtime operations only

### Migration User (`connectsa_migration_user`)

- **Role**: `connectsa_migration`
- **Login**: Yes
- **Password**: Set via CI/CD secrets
- **Connection String**: Used in CI/CD for migrations
- **Access**: CI/CD pipelines only

### Developer User (`connectsa_dev_user`)

- **Role**: `connectsa_dev_readonly`
- **Login**: Yes
- **Password**: Set securely, shared only with authorized developers
- **Connection String**: Separate read-only connection
- **Access**: Read-only debugging access

---

## Permission Matrix

### Table Operations

| Operation | App Runtime | Migration | Dev Read-Only |
|-----------|-------------|-----------|---------------|
| SELECT | ✅ | ✅ | ✅ |
| INSERT | ✅ | ✅ | ❌ |
| UPDATE | ✅ | ✅ | ❌ |
| DELETE | ❌ | ✅ | ❌ |
| TRUNCATE | ❌ | ❌ | ❌ |
| ALTER | ❌ | ✅ | ❌ |
| DROP | ❌ | ❌ | ❌ |
| CREATE TABLE | ❌ | ✅ | ❌ |
| CREATE INDEX | ❌ | ✅ | ❌ |

### Schema Operations

| Operation | App Runtime | Migration | Dev Read-Only |
|-----------|-------------|-----------|---------------|
| USAGE | ✅ | ✅ | ✅ |
| CREATE | ❌ | ✅ | ❌ |

### Sequence Operations

| Operation | App Runtime | Migration | Dev Read-Only |
|-----------|-------------|-----------|---------------|
| SELECT | ✅ | ✅ | ✅ |
| USAGE | ✅ | ✅ | ❌ |
| UPDATE | ✅ | ✅ | ❌ |

---

## Safety Constraints

### 1. Row Level Security (RLS)

**Status**: Enabled on sensitive tables

**Tables with RLS**:
- `users`
- `providers`
- `payments`
- `payouts`
- `bookings`

**Purpose**: Adds an extra layer of protection against bulk operations and unauthorized access.

**Note**: RLS policies need to be configured based on your access patterns. Currently, RLS is enabled but allows all access (policies to be added).

### 2. Bulk DELETE Prevention

**Implementation**: 
- Application role cannot DELETE (permission revoked)
- Migration role can DELETE but only in controlled CI/CD environment
- Application should implement soft deletes (status flags)

**Recommendation**: Implement application-level checks to prevent bulk DELETE operations even if permissions allow.

### 3. DROP Prevention

**Implementation**:
- All roles cannot DROP tables
- DROP operations require superuser/admin intervention
- This prevents accidental table deletion

---

## Setup Instructions

### 1. Audit Current Roles

```bash
# Run audit script to see current state
psql $DATABASE_URL -f scripts/audit-database-roles.sql
```

### 2. Create Secure Roles

```bash
# Run setup script (in production/CI environment only)
psql $DATABASE_URL -f scripts/setup-database-roles.sql
```

### 3. Set Passwords

```sql
-- Set secure passwords for all users
ALTER USER connectsa_app_user WITH PASSWORD 'secure_password_here';
ALTER USER connectsa_migration_user WITH PASSWORD 'secure_password_here';
ALTER USER connectsa_dev_user WITH PASSWORD 'secure_password_here';
```

### 4. Update Connection Strings

**Application** (`DATABASE_URL`):
```
postgresql://connectsa_app_user:password@host:port/database
```

**CI/CD Migrations** (`MIGRATION_DATABASE_URL`):
```
postgresql://connectsa_migration_user:password@host:port/database
```

**Developer Read-Only** (`DEV_READONLY_DATABASE_URL`):
```
postgresql://connectsa_dev_user:password@host:port/database
```

### 5. Verify Permissions

```bash
# Run verification script
psql $DATABASE_URL -f scripts/verify-database-permissions.sql

# Or use Node.js script
node scripts/verify-database-permissions.js
```

---

## CI/CD Integration

### GitHub Actions

```yaml
env:
  MIGRATION_DATABASE_URL: ${{ secrets.MIGRATION_DATABASE_URL }}

steps:
  - name: Run migrations
    run: |
      DATABASE_URL=$MIGRATION_DATABASE_URL npm run db:migrate:deploy
```

### Vercel

1. Add `MIGRATION_DATABASE_URL` to Vercel environment variables
2. Use in build command:
   ```json
   {
     "buildCommand": "DATABASE_URL=$MIGRATION_DATABASE_URL npm run db:migrate:deploy && npm run build"
   }
   ```

---

## Security Best Practices

### 1. Credential Management

- ✅ Never store credentials in code
- ✅ Use environment variables in production
- ✅ Use secrets management (GitHub Secrets, Vercel, etc.)
- ✅ Rotate passwords regularly
- ✅ Never commit credentials to git

### 2. Access Control

- ✅ Grant access on need-to-know basis
- ✅ Use read-only role for debugging
- ✅ Limit migration role to CI/CD only
- ✅ Monitor and audit all database access

### 3. Operational Safety

- ✅ Test migrations in staging first
- ✅ Backup database before migrations
- ✅ Use transactions for data migrations
- ✅ Implement soft deletes in application
- ✅ Review all DROP operations manually

---

## Troubleshooting

### Issue: "Permission denied" errors

**Solution**: Verify that the connection is using the correct user and role:
```sql
SELECT current_user, session_user;
```

### Issue: Migrations fail with permission errors

**Solution**: Ensure migrations use `MIGRATION_DATABASE_URL` with `connectsa_migration` role.

### Issue: Application cannot INSERT/UPDATE

**Solution**: Verify application uses `connectsa_app_runtime` role via `connectsa_app_user`.

---

## Compliance and Auditing

### Access Logging

All database access should be logged:
- Connection attempts
- Failed authentication
- Permission denials
- Administrative operations

### Regular Audits

Perform regular audits:
1. Review role permissions (quarterly)
2. Audit user access (monthly)
3. Review failed permission attempts (weekly)
4. Rotate credentials (quarterly)

---

## Role Assignment Table

| Environment | Role | User | Connection String Variable |
|-------------|------|------|---------------------------|
| Production Runtime | `connectsa_app_runtime` | `connectsa_app_user` | `DATABASE_URL` |
| CI/CD Migrations | `connectsa_migration` | `connectsa_migration_user` | `MIGRATION_DATABASE_URL` |
| Developer Debug | `connectsa_dev_readonly` | `connectsa_dev_user` | `DEV_READONLY_DATABASE_URL` |

---

## Verification Checklist

After setup, verify:

- [ ] Application role cannot DELETE
- [ ] Application role cannot DROP
- [ ] Application role cannot TRUNCATE
- [ ] Application role cannot ALTER
- [ ] Developer role is read-only
- [ ] Migration role cannot DROP
- [ ] All passwords are changed from defaults
- [ ] Connection strings use correct users
- [ ] CI/CD uses migration role
- [ ] RLS is enabled on sensitive tables

---

**Status**: ✅ **DOCUMENTED**  
**Last Reviewed**: $(date)  
**Next Review**: $(date +3 months)
