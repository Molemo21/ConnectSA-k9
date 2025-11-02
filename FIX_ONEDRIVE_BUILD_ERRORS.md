# Fix OneDrive File Lock Errors

## 🔴 **Problem**
You're seeing errors like:
```
[Error: UNKNOWN: unknown error, open 'C:\Users\...\.next-dev\static\chunks\app\layout.js']
```

This happens because **OneDrive is syncing your project folder** and locking files that Next.js is trying to access.

---

## ✅ **Solution (Choose One)**

### **Option 1: Quick Fix (Recommended)**

1. **Stop your dev server** (Ctrl+C in the terminal where `pnpm dev` is running)

2. **Clean the build folder:**
   ```bash
   node scripts/clean-next-build.js
   ```

3. **Restart the dev server:**
   ```bash
   pnpm dev
   ```

---

### **Option 2: Exclude Project from OneDrive**

**Best for long-term development:**

1. **Right-click your project folder** (`ConnectSA-k9`)
2. **Select "OneDrive" → "Free up space"** (or "Always keep on this device")
3. **OR exclude the entire folder:**
   - Open OneDrive Settings
   - Go to "Sync and backup" → "Advanced settings"
   - Add your project folder to exclusions

---

### **Option 3: Use Standard .next Folder**

If `.next-dev` keeps causing issues, switch to standard `.next`:

1. **Update `.gitignore`** (already done - `.next-dev` is ignored)
2. **Update `next.config.mjs`:**
   ```js
   distDir: process.env.VERCEL ? '.next' : '.next',
   ```
3. **Clean and restart:**
   ```bash
   node scripts/clean-next-build.js
   pnpm dev
   ```

---

## 🛠️ **Prevention**

1. ✅ **Added `.next-dev` to `.gitignore`** (prevents Git from tracking it)
2. ✅ **Created cleanup script** (`scripts/clean-next-build.js`)
3. 💡 **Best Practice:** Keep your project folder **outside OneDrive sync** or use "Always keep on this device"

---

## 📝 **Why This Happens**

- OneDrive syncs files in real-time
- Next.js dev server writes/reads files constantly
- OneDrive locks files during sync → Next.js can't access them → Error

**Solution:** Either exclude the project from OneDrive OR use "Always keep on this device" so files aren't synced.

---

## 🚀 **Quick Commands**

```bash
# Clean build folders
node scripts/clean-next-build.js

# Or manually (Windows)
rmdir /s /q .next-dev
rmdir /s /q .next

# Then restart
pnpm dev
```

---

**The error should be fixed now!** 🎉




