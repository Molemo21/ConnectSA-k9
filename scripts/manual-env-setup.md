# Manual Environment Setup

Since the .env file is protected, please manually create or update your `.env` file with the following content:

## .env file content:

```bash
# Database Configuration
# Prisma Client (Runtime) - Uses pooler for better performance
DATABASE_URL="postgresql://postgres:<password>@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=10&pool_timeout=60&connection_limit=5"
PRISMA_DISABLE_PREPARED_STATEMENTS=true

# Direct Connection (Migrations) - Uses direct connection for schema changes
DIRECT_URL="postgresql://postgres:<password>@aws-0-eu-west-1.supabase.com:5432/postgres?sslmode=require"

# Application Configuration
NODE_ENV=development
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

## Steps to complete the setup:

1. **Create/Update .env file**: Copy the content above into your `.env` file
2. **Generate Prisma client**: Run `npx prisma generate`
3. **Deploy migrations**: Run `npx prisma migrate deploy`
4. **Restart server**: Run `npm run dev`

## Alternative approach (if Prisma generate fails):

If you get permission errors with `npx prisma generate`, try:

1. **Delete node_modules/.prisma**: `rm -rf node_modules/.prisma`
2. **Clear npm cache**: `npm cache clean --force`
3. **Reinstall dependencies**: `npm install`
4. **Generate again**: `npx prisma generate`

## Test the connection:

After setup, test with: `node -e "const { prisma } = require('./lib/prisma'); console.log('Prisma client:', !!prisma);"`
