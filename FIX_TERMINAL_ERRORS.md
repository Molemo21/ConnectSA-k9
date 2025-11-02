# 🔧 Fix Terminal Errors (OneDrive File Lock Issues)

## 🎯 **Quick Fix (Recommended)**

The errors you're seeing are caused by OneDrive syncing the `.next-dev` build folder, which locks files that Next.js needs to access.

### **Step 1: Clean Build Folders**
```bash
node scripts/clean-next-build.js
```

### **Step 2: Restart Dev Server**
```bash
npm run dev
```

The errors should be gone now! ✅

---

## 🛡️ **Long-Term Solution (Prevent Future Errors)**

### **Option 1: Exclude .next-dev from OneDrive (Best)**

1. **Right-click your project folder** (`ConnectSA-k9`)
2. **Select "OneDrive" → "Always keep on this device"**
   - This keeps files local and prevents sync conflicts
   - Files won't be synced but will still be backed up if you manually sync

**OR**

1. Open **OneDrive Settings**
2. Go to **Sync and backup** → **Advanced settings**
3. Add these folders to exclusions:
   - `.next-dev`
   - `node_modules`
   - `.next`

### **Option 2: Use Quiet Mode**

If you can't change OneDrive settings, use the quiet mode:

```bash
npm run dev:quiet
```

This suppresses the OneDrive error messages while keeping other errors visible.

### **Option 3: Move Project Outside OneDrive**

If issues persist, move your project to a location outside OneDrive:
- `C:\Projects\ConnectSA-k9` (recommended)
- `D:\Development\ConnectSA-k9`

---

## 📋 **What Was Fixed**

1. ✅ **Created cleanup script** (`scripts/clean-next-build.js`)
   - Automatically removes locked build directories

2. ✅ **Added error suppression** (`scripts/suppress-onedrive-errors.js`)
   - Filters out noisy OneDrive errors from terminal output

3. ✅ **Improved server error handling**
   - Better handling of file lock errors

4. ✅ **Added npm scripts**
   - `npm run dev:clean` - Clean and start
   - `npm run dev:quiet` - Start with error suppression

---

## 🔍 **Understanding the Error**

The error you're seeing:
```
[Error: UNKNOWN: unknown error, open '.next-dev\server\app-paths-manifest.json']
errno: -4094
```

**What it means:**
- OneDrive is syncing files in real-time
- Next.js tries to read/write build files
- OneDrive locks files during sync
- Next.js can't access locked files → Error

**Why it's safe to ignore:**
- These errors don't break functionality
- Files are usually available on retry
- The app still works correctly

**Why we fixed it:**
- Makes terminal output cleaner
- Easier to see real errors
- Better developer experience

---

## 🚀 **Quick Reference**

```bash
# Clean build (when you see errors)
node scripts/clean-next-build.js

# Start dev server normally
npm run dev

# Start dev server (clean first)
npm run dev:clean

# Start dev server (suppress OneDrive errors)
npm run dev:quiet
```

---

## ✅ **Verification**

After running the cleanup script, you should see:
- ✅ No more `UNKNOWN: unknown error` messages
- ✅ Clean terminal output
- ✅ Dev server runs smoothly

**If errors persist:**
1. Stop the dev server (Ctrl+C)
2. Run `node scripts/clean-next-build.js` again
3. Use `npm run dev:quiet` for cleaner output

---

**The terminal should now be clean!** 🎉




