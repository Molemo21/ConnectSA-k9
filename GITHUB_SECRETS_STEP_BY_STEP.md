# 📝 Step-by-Step: Adding GitHub Repository Secrets

## Where to Add Secrets

✅ **Use: Repository secrets** (NOT Environment secrets)

**Why?**
- Repository secrets are available to all workflows in your repository
- The workflow uses `${{ secrets.DEV_DATABASE_URL }}` which refers to repository secrets
- Environment secrets are for environment-specific deployments (more advanced)

---

## Step-by-Step Instructions

### Step 1: Navigate to Secrets

1. **Go to your repository:**
   ```
   https://github.com/Molemo21/ConnectSA-k9
   ```

2. **Click "Settings"** (top navigation bar)

3. **In the left sidebar, click:** "Secrets and variables"

4. **Click:** "Actions"

5. **You'll see two tabs:**
   - **"Secrets"** tab ← Use this one!
   - **"Variables"** tab (ignore for now)

6. **Under "Repository secrets" section, click:**
   ```
   "New repository secret" button (top right)
   ```

---

### Step 2: Add Each Secret

You'll add 6 secrets total. For each one:

#### Secret 1: DATABASE_URL

1. Click **"New repository secret"**
2. **Name:** `DATABASE_URL` (exactly as shown, case-sensitive)
3. **Secret:** Paste your production database URL from Vercel
4. Click **"Add secret"**

#### Secret 2: DIRECT_URL

1. Click **"New repository secret"**
2. **Name:** `DIRECT_URL`
3. **Secret:** Your direct database URL (from Vercel, or create from DATABASE_URL by changing port to 5432)
4. Click **"Add secret"**

#### Secret 3: DEV_DATABASE_URL

1. Click **"New repository secret"**
2. **Name:** `DEV_DATABASE_URL`
3. **Secret:** 
   - If using same DB for dev/prod: Same as DATABASE_URL
   - If different: Your local `.env.development` DATABASE_URL
4. Click **"Add secret"**

#### Secret 4: PROD_DATABASE_URL

1. Click **"New repository secret"**
2. **Name:** `PROD_DATABASE_URL`
3. **Secret:** Same as DATABASE_URL (your production database URL from Vercel)
4. Click **"Add secret"**

#### Secret 5: NEXTAUTH_SECRET

1. Click **"New repository secret"**
2. **Name:** `NEXTAUTH_SECRET`
3. **Secret:** Copy from Vercel → Settings → Environment Variables → NEXTAUTH_SECRET
4. Click **"Add secret"**

#### Secret 6: JWT_SECRET

1. Click **"New repository secret"**
2. **Name:** `JWT_SECRET`
3. **Secret:** Copy from Vercel → Settings → Environment Variables → JWT_SECRET
4. Click **"Add secret"**

---

## Visual Guide

```
GitHub Repository
├── Settings
    ├── Secrets and variables
        ├── Actions
            ├── [TAB] Secrets ← Click this tab
            │   ├── Repository secrets ← Add secrets here
            │   │   └── "New repository secret" button ← Click this
            │   └── Environment secrets ← Don't use this
            └── [TAB] Variables (ignore for now)
```

---

## After Adding All Secrets

You should see a list like this:

```
Repository secrets
├── DATABASE_URL         (updated X minutes ago)
├── DIRECT_URL           (updated X minutes ago)
├── DEV_DATABASE_URL     (updated X minutes ago)
├── PROD_DATABASE_URL    (updated X minutes ago)
├── NEXTAUTH_SECRET      (updated X minutes ago)
└── JWT_SECRET           (updated X minutes ago)
```

**Note:** Values are hidden and shown as `••••••••` for security.

---

## Verification

After adding all 6 secrets:

1. ✅ Check you're in the **"Repository secrets"** section (not Environment secrets)
2. ✅ All 6 secrets are listed
3. ✅ Each shows when it was last updated
4. ✅ Values are hidden (as `••••••••`)

---

## Quick Checklist

Use this checklist to ensure you've added all required secrets:

- [ ] `DATABASE_URL` - Production database URL
- [ ] `DIRECT_URL` - Direct database URL (for migrations)
- [ ] `DEV_DATABASE_URL` - Dev database URL (or same as DATABASE_URL)
- [ ] `PROD_DATABASE_URL` - Production database URL (same as DATABASE_URL)
- [ ] `NEXTAUTH_SECRET` - NextAuth secret from Vercel
- [ ] `JWT_SECRET` - JWT secret from Vercel

---

## Common Mistakes to Avoid

❌ **Don't add to Environment secrets** - Use Repository secrets  
❌ **Don't misspell secret names** - They're case-sensitive  
❌ **Don't add extra spaces** - Copy/paste carefully  
❌ **Don't share secret values** - They're private for security  

---

## Getting Values from Vercel

If you need to get values from Vercel:

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to: **Settings → Environment Variables**
4. Make sure you're viewing **Production** environment
5. Copy each value:
   - `DATABASE_URL` → Use for `DATABASE_URL` and `PROD_DATABASE_URL`
   - `DIRECT_URL` → Use for `DIRECT_URL` (or create from DATABASE_URL)
   - `NEXTAUTH_SECRET` → Use for `NEXTAUTH_SECRET`
   - `JWT_SECRET` → Use for `JWT_SECRET`

For `DEV_DATABASE_URL`:
- If same DB: Use same value as `DATABASE_URL`
- If different: Use your local `.env.development` `DATABASE_URL`

---

## Troubleshooting

### Issue: "Can't find Repository secrets section"

**Solution:**
- Make sure you're in: Settings → Secrets and variables → Actions → **Secrets tab**
- Look for "Repository secrets" heading
- If you see "Environment secrets" instead, you're in the wrong section

### Issue: "Secret not found" error in workflow

**Possible causes:**
1. Added to Environment secrets instead of Repository secrets
2. Typo in secret name (case-sensitive!)
3. Secret not actually saved (check the list)

**Solution:**
1. Double-check you added to **Repository secrets**
2. Verify exact spelling (compare with workflow file)
3. Make sure you clicked "Add secret" after entering value

---

## Next Steps

After adding all secrets:

1. ✅ Verify all 6 are listed under Repository secrets
2. ✅ Push a commit to trigger the workflow
3. ✅ Check GitHub Actions to see if it runs successfully
4. ✅ Look for "✅ Reference data promotion configured" in logs

---

**You're adding secrets to the right place: Repository secrets!** ✅
