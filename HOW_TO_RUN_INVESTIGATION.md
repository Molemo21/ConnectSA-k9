# 🔍 How to Run Production Investigation Script

## Quick Start

### Step 1: Navigate to Project Root
```bash
cd ConnectSA-k9
```

### Step 2: Set Production Database URL

**Option A: Environment Variable (Recommended)**

**Windows (Git Bash):**
```bash
export PROD_DATABASE_URL=postgresql://user:password@host:port/database
```

**Windows (PowerShell):**
```powershell
$env:PROD_DATABASE_URL="postgresql://user:password@host:port/database"
```

**Windows (CMD):**
```cmd
set PROD_DATABASE_URL=postgresql://user:password@host:port/database
```

**Mac/Linux:**
```bash
export PROD_DATABASE_URL=postgresql://user:password@host:port/database
```

**Option B: Create .env.production.local File**

Create a file named `.env.production.local` in the `ConnectSA-k9` directory:

```bash
# .env.production.local
PROD_DATABASE_URL=postgresql://user:password@host:port/database
```

**Note:** This file is gitignored, so it won't be committed.

### Step 3: Run the Script

```bash
npm run investigate:specialized:cleaning
```

---

## Where to Get Production Database URL

### From Vercel Dashboard:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Find `PROD_DATABASE_URL` or `DATABASE_URL`
5. Copy the value

### From Your Database Provider:
- **Supabase**: Project Settings → Database → Connection String
- **Railway**: Service → Variables → DATABASE_URL
- **AWS RDS**: Connection String from RDS Console
- **Other**: Check your database provider's documentation

---

## Example Commands

### Full Example (Windows Git Bash):
```bash
# Navigate to project
cd ConnectSA-k9

# Set production database URL
export PROD_DATABASE_URL=postgresql://postgres:password@host.supabase.co:5432/postgres

# Run investigation
npm run investigate:specialized:cleaning
```

### Full Example (Windows PowerShell):
```powershell
# Navigate to project
cd ConnectSA-k9

# Set production database URL
$env:PROD_DATABASE_URL="postgresql://postgres:password@host.supabase.co:5432/postgres"

# Run investigation
npm run investigate:specialized:cleaning
```

### Full Example (Mac/Linux):
```bash
# Navigate to project
cd ConnectSA-k9

# Set production database URL
export PROD_DATABASE_URL=postgresql://postgres:password@host.supabase.co:5432/postgres

# Run investigation
npm run investigate:specialized:cleaning
```

---

## What the Script Does

1. ✅ Connects to production database
2. ✅ Lists all cleaning services
3. ✅ Checks for "Mobile Car Wash" and "Office Cleaning"
4. ✅ Tests exact name matching
5. ✅ Simulates frontend filtering logic
6. ✅ Provides specific recommendations

---

## Troubleshooting

### Error: "DATABASE_URL environment variable is required"

**Solution:** Make sure you set `PROD_DATABASE_URL`:
```bash
# Check if it's set
echo $PROD_DATABASE_URL  # Git Bash/Mac/Linux
echo $env:PROD_DATABASE_URL  # PowerShell
```

### Error: "Can't reach database server"

**Possible Causes:**
1. Database URL is incorrect
2. Database server is not accessible from your network
3. Firewall blocking connection
4. Database credentials are wrong

**Solution:**
- Verify database URL is correct
- Check if database allows connections from your IP
- Verify credentials

### Error: "Module not found" or "tsx not found"

**Solution:** Install dependencies:
```bash
npm install
```

---

## Security Note

⚠️ **IMPORTANT:** Never commit production database URLs to git!

- Use environment variables
- Or use `.env.production.local` (already in .gitignore)
- Never share database URLs in screenshots or public channels

---

## Alternative: Run with Direct URL

If you don't want to set environment variables, you can modify the script temporarily:

```typescript
// In scripts/investigate-production-specialized-cleaning.ts
// Replace this line:
const dbUrl = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;

// With (temporarily):
const dbUrl = 'your-production-database-url-here';
```

**Remember to revert this change after running!**

---

## Expected Output

The script will output:
- ✅ List of all services in production database
- ✅ Exact name matching results
- ✅ Frontend filtering simulation
- ✅ Specific recommendations for fixes

---

**Location:** Run from `ConnectSA-k9/` directory (project root)
