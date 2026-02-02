# Add Database Environment Fingerprint

This script fixes the "Environment Fingerprint Validation Failed" error by adding the required fingerprint record to your database.

## Quick Fix (Recommended)

Run the Node.js script (it will automatically load your `.env` file):

```bash
cd ConnectSA-k9
node scripts/run-add-fingerprint.js
```

## Alternative: Run SQL Script Directly

If you prefer to run the SQL script directly using `psql` or your database client:

```bash
# Using psql
psql $DATABASE_URL -f scripts/add-database-fingerprint.sql

# Or if you have the connection string in .env
source .env
psql "$DATABASE_URL" -f scripts/add-database-fingerprint.sql
```

## What This Does

1. Checks if the `database_metadata` table exists
2. Inserts or updates a fingerprint record with:
   - **ID**: `singleton` (required by validation system)
   - **Environment**: `dev`
   - **Fingerprint**: A unique identifier
3. Verifies the record was created successfully

## After Running

Once the fingerprint is added, you should:
- ✅ No longer see "Environment Fingerprint Validation Failed" errors
- ✅ See "✅ Database connection established successfully" messages
- ✅ Have all Prisma queries work without connection warnings

## Troubleshooting

### Error: "DATABASE_URL environment variable is not set"

Make sure you have a `.env` file in the `ConnectSA-k9` directory with:
```bash
DATABASE_URL="your-database-connection-string"
```

### Error: "database_metadata table does not exist"

Run Prisma migrations first:
```bash
npx prisma migrate deploy
```

### Still seeing errors?

1. Restart your dev server after running the script
2. Check that the record exists:
   ```sql
   SELECT * FROM database_metadata WHERE id = 'singleton';
   ```
