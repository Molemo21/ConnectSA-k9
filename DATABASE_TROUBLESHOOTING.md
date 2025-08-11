# Database Connection Troubleshooting Guide

## Common Issues and Solutions

### 1. "Can't reach database server" Error

This error typically occurs when your application can't connect to the Supabase database.

#### Quick Fixes:

1. **Check your `.env` file**
   ```bash
   # Make sure you have this in your .env file
   DATABASE_URL="postgresql://username:password@host:port/database"
   ```

2. **Switch to direct connection**
   ```bash
   # Replace your pooler URL with direct connection URL
   # From: postgresql://...pooler.supabase.com:6543/...
   # To: postgresql://...supabase.com:5432/...
   ```

3. **Run the database check script**
   ```bash
   node scripts/check-db.js
   ```

### 2. Supabase Connection Issues

#### Pooler vs Direct Connection

**Pooler Connection (default):**
```
postgresql://username:password@aws-0-eu-west-1.pooler.supabase.com:6543/database?pgbouncer=true
```

**Direct Connection (recommended for development):**
```
postgresql://username:password@aws-0-eu-west-1.supabase.com:5432/database
```

#### How to Switch:

1. Go to your Supabase dashboard
2. Navigate to Settings > Database
3. Copy the "Connection string" (direct connection)
4. Update your `.env` file

### 3. Environment Variables

Make sure your `.env` file has the correct variables:

```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# JWT (for authentication)
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret" # Optional

# Environment
NODE_ENV="development"
```

### 4. Network Issues

#### Check Internet Connection
```bash
# Test connectivity to Supabase
ping aws-0-eu-west-1.supabase.com
```

#### Firewall/Proxy Issues
- Check if your network blocks port 5432 or 6543
- Try using a different network
- Check if you're behind a corporate firewall

### 5. Supabase Dashboard Checks

1. **Database Status**
   - Go to Supabase Dashboard > Projects > Your Project
   - Check if the database is "Online"

2. **IP Whitelist**
   - Go to Settings > Database
   - Check if your IP is whitelisted
   - Add your current IP if needed

3. **Connection String**
   - Go to Settings > Database
   - Copy the correct connection string
   - Make sure you're using the right format

### 6. Testing Connection

#### Using the Check Script
```bash
# Run the database check script
node scripts/check-db.js
```

#### Manual Testing
```bash
# Test with psql (if installed)
psql "postgresql://username:password@host:port/database"

# Test with curl
curl -X GET http://localhost:3000/api/health
```

### 7. Common Error Messages

#### "Invalid password"
- Check your database password in Supabase dashboard
- Make sure you're using the correct credentials

#### "Connection timeout"
- Check your internet connection
- Try switching to direct connection
- Check if Supabase is experiencing issues

#### "SSL connection required"
- Make sure your connection string includes SSL parameters
- Try adding `?sslmode=require` to your URL

### 8. Development vs Production

#### Development
```env
# Use direct connection for better reliability
DATABASE_URL="postgresql://username:password@host:5432/database"
```

#### Production
```env
# Use pooler connection for better performance
DATABASE_URL="postgresql://username:password@host:6543/database?pgbouncer=true"
```

### 9. Emergency Solutions

#### If nothing works:

1. **Reset your database connection**
   ```bash
   # Clear Prisma cache
   npx prisma generate
   ```

2. **Check Supabase status**
   - Visit https://status.supabase.com
   - Check if there are any ongoing issues

3. **Contact Support**
   - Check Supabase documentation
   - Reach out to Supabase support

### 10. Prevention Tips

1. **Use environment-specific URLs**
   - Different URLs for dev/staging/prod
   - Never commit real credentials

2. **Monitor connection health**
   - Use the health check endpoint
   - Set up monitoring for database connectivity

3. **Regular backups**
   - Back up your database regularly
   - Test your backup restoration process

## Quick Commands

```bash
# Check database connection
node scripts/check-db.js

# Test health endpoint
curl http://localhost:3000/api/health

# Regenerate Prisma client
npx prisma generate

# Reset Prisma cache
npx prisma db pull
``` 