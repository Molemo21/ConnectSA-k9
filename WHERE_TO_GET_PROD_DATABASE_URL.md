# 🔍 Where to Get and Set PROD_DATABASE_URL

## Quick Answer

**You need to get your production database URL from one of these places:**

1. **Vercel Dashboard** (Recommended - if you're using Vercel)
2. **Your Database Provider** (Supabase, Railway, AWS, etc.)
3. **GitHub Secrets** (if you set it there for CI/CD)

---

## Option 1: Get from Vercel Dashboard (Recommended)

### Steps:

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Login to your account

2. **Select Your Project:**
   - Click on your ConnectSA project

3. **Go to Settings:**
   - Click **"Settings"** in the top menu
   - Click **"Environment Variables"** in the left sidebar

4. **Find Database URL:**
   - Look for `DATABASE_URL` or `PROD_DATABASE_URL`
   - Click on it to reveal the value
   - **Copy the entire URL**

5. **Use it in terminal:**
   ```bash
   # Windows (Git Bash)
   export PROD_DATABASE_URL=postgresql://postgres:password@host:port/database
   
   # Windows (PowerShell)
   $env:PROD_DATABASE_URL="postgresql://postgres:password@host:port/database"
   ```

---

## Option 2: Get from Supabase (If using Supabase)

### Steps:

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Login to your account

2. **Select Your Project:**
   - Click on your production project

3. **Go to Project Settings:**
   - Click **"Project Settings"** (gear icon in left sidebar)
   - Click **"Database"** in the settings menu

4. **Get Connection String:**
   - Scroll to **"Connection string"** section
   - Select **"URI"** tab
   - Copy the connection string
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

5. **Replace [YOUR-PASSWORD]:**
   - Replace `[YOUR-PASSWORD]` with your actual database password
   - Or use the **"Connection pooling"** URL (port 6543) if available

---

## Option 3: Get from GitHub Secrets (For CI/CD)

### Steps:

1. **Go to GitHub Repository:**
   - Visit: https://github.com/your-username/ConnectSA-k9
   - Click **"Settings"**

2. **Go to Secrets:**
   - Click **"Secrets and variables"** → **"Actions"**

3. **Find Database URL:**
   - Look for `PROD_DATABASE_URL` or `DATABASE_URL`
   - **Note:** You can't view the value, only update it
   - If you need the value, you'll need to get it from Vercel or your database provider

---

## Option 4: Create .env.production.local File (Local Only)

**This file is gitignored, so it won't be committed.**

### Steps:

1. **Create file in project root:**
   ```bash
   cd ConnectSA-k9
   ```

2. **Create .env.production.local:**
   ```bash
   # Windows (Git Bash)
   echo PROD_DATABASE_URL=postgresql://postgres:password@host:port/database > .env.production.local
   
   # Or manually create the file with this content:
   ```

3. **File content (.env.production.local):**
   ```bash
   PROD_DATABASE_URL=postgresql://postgres:password@host:port/database
   ```

4. **The script will automatically load it**

---

## How to Set It (Choose One Method)

### Method 1: Temporary (Current Terminal Session Only)

**Windows (Git Bash):**
```bash
export PROD_DATABASE_URL=postgresql://postgres:password@host:port/database
npm run investigate:specialized:cleaning
```

**Windows (PowerShell):**
```powershell
$env:PROD_DATABASE_URL="postgresql://postgres:password@host:port/database"
npm run investigate:specialized:cleaning
```

**Windows (CMD):**
```cmd
set PROD_DATABASE_URL=postgresql://postgres:password@host:port/database
npm run investigate:specialized:cleaning
```

**Mac/Linux:**
```bash
export PROD_DATABASE_URL=postgresql://postgres:password@host:port/database
npm run investigate:specialized:cleaning
```

### Method 2: Permanent (Create .env.production.local)

1. **Create file:** `.env.production.local` in `ConnectSA-k9/` directory
2. **Add line:**
   ```
   PROD_DATABASE_URL=postgresql://postgres:password@host:port/database
   ```
3. **Run script:**
   ```bash
   npm run investigate:specialized:cleaning
   ```

---

## Example Database URL Formats

### Supabase:
```
postgresql://postgres.xxxxx:password@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

### Railway:
```
postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
```

### AWS RDS:
```
postgresql://username:password@database-1.xxxxx.us-east-1.rds.amazonaws.com:5432/dbname
```

### Generic PostgreSQL:
```
postgresql://username:password@host:port/database
```

---

## Security Warning

⚠️ **NEVER:**
- Commit database URLs to git
- Share database URLs in screenshots
- Post database URLs in public channels
- Store database URLs in non-gitignored files

✅ **ALWAYS:**
- Use environment variables
- Use `.env.production.local` (already in .gitignore)
- Keep database URLs private
- Rotate passwords if exposed

---

## Quick Check: Is It Set?

**Check if PROD_DATABASE_URL is set:**

**Windows (Git Bash):**
```bash
echo $PROD_DATABASE_URL
```

**Windows (PowerShell):**
```powershell
echo $env:PROD_DATABASE_URL
```

**Mac/Linux:**
```bash
echo $PROD_DATABASE_URL
```

**If it shows the URL, it's set correctly!**

---

## Still Can't Find It?

1. **Check Vercel Dashboard** - Most likely place
2. **Check your database provider dashboard** (Supabase, Railway, etc.)
3. **Check your deployment platform** (Vercel, Netlify, etc.)
4. **Ask your team** if someone else set it up

---

**Once you have the URL, set it using one of the methods above and run:**
```bash
npm run investigate:specialized:cleaning
```
