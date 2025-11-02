# 🔓 Fix OneDrive File Lock Error

## **Problem**

Getting this error when trying to save `next.config.mjs`:
```
Failed to save 'next.config.mjs': Unable to write file
Error: UNKNOWN: unknown error, open 'next.config.mjs'
```

**Root Cause:** OneDrive is syncing the file and has it locked for writing.

---

## **Immediate Solutions** (Try These in Order)

### **Solution 1: Pause OneDrive Sync** ⚡ (Fastest)

1. **Right-click OneDrive icon** in system tray (bottom-right)
2. **Click "Pause syncing"** → Choose "2 hours" or "24 hours"
3. **Try saving the file again**
4. Resume sync after saving

---

### **Solution 2: Set File to "Always Keep on Device"** ✅ (Recommended)

This prevents OneDrive from locking files during sync:

1. **Right-click `next.config.mjs`** in File Explorer
2. **Select "OneDrive"** → **"Always keep on this device"**
3. **Wait a few seconds** for OneDrive to download the file
4. **Try saving again**

**Note:** This tells OneDrive to keep a local copy, reducing sync conflicts.

---

### **Solution 3: Close and Reopen File** 🔄

1. **Close `next.config.mjs`** in Cursor/VS Code
2. **Wait 10-15 seconds** for OneDrive to finish syncing
3. **Reopen the file**
4. **Try saving again**

---

### **Solution 4: Use Terminal to Save** 💻

If editor still fails, save via terminal:

1. **Make your edits in the editor** (don't save)
2. **Copy the content**
3. **Use this command:**
   ```bash
   # In terminal, create a temporary version
   cat > next.config.mjs.backup << 'EOF'
   [paste your content here]
   EOF
   ```

Or use a script:
```bash
node scripts/unlock-file.js next.config.mjs
```

---

### **Solution 5: Exclude File from OneDrive** 🚫 (Long-term)

1. **Right-click the project folder** in File Explorer
2. **Properties** → **Advanced**
3. **Uncheck "File is ready for archiving"** (or use OneDrive settings)
4. **Or:** Move project outside OneDrive folder

---

## **Prevention** (Long-term Solutions)

### **Option A: Exclude `.next-dev` from OneDrive** (Already Done ✅)

We've already configured the code to ignore `.next-dev` folder. For `next.config.mjs`:

1. Right-click `next.config.mjs`
2. OneDrive → Always keep on this device

### **Option B: Move Project Outside OneDrive**

Move your project to a non-OneDrive location:
- `C:\Projects\ConnectSA-k9\` (instead of OneDrive)
- This completely avoids sync conflicts

### **Option C: Configure OneDrive to Skip Config Files**

1. Open **OneDrive Settings**
2. **Sync and backup** → **Advanced settings**
3. **Add `next.config.mjs` to exclusion list** (if supported)

---

## **Quick Fix Script**

I've created a diagnostic script:

```bash
# Check file status
node scripts/unlock-file.js next.config.mjs

# Or check any file
node scripts/unlock-file.js [file-path]
```

---

## **Current File Status**

The file `next.config.mjs` exists and is readable. The issue is that **OneDrive is preventing writes** during sync.

**Recommended Action:**
1. **Pause OneDrive sync** (system tray) for 2 hours
2. **Save your file**
3. **Resume OneDrive sync**

Or set the file to "Always keep on this device" for permanent fix.

---

## **Why This Happens**

- OneDrive syncs files in real-time
- During sync, files are locked to prevent conflicts
- Your editor tries to save → OneDrive has lock → Error
- This is **harmless** but **annoying** for active development

**Best Practice:** Keep frequently-edited config files as "Always keep on this device" in OneDrive.




