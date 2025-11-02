# 🚨 OneDrive File Lock - Quick Fix Guide

## **Error You're Seeing**
```
Failed to save 'notification-popup.tsx': Unable to write file
Error: UNKNOWN: unknown error, open 'notification-popup.tsx'
```

## ⚡ **Quick Fix (Do This Now)**

### **Option 1: Pause OneDrive Sync** (30 seconds)
1. Find **OneDrive icon** in your system tray (bottom-right corner)
2. **Right-click** the OneDrive icon
3. Click **"Pause syncing"** → Choose **"2 hours"**
4. **Go back to Cursor/VS Code**
5. **Try saving the file again** (Ctrl+S)
6. Once saved, resume OneDrive sync if needed

### **Option 2: Set File to Always Keep Locally** (1 minute - Recommended)
This prevents future lock issues:

1. Open **File Explorer**
2. Navigate to: `C:\Users\liqui\OneDrive\Desktop\ConnectSA\ConnectSA-k9\components\ui\`
3. **Right-click** `notification-popup.tsx`
4. Click **"OneDrive"** → **"Always keep on this device"**
5. Wait 5-10 seconds for OneDrive to finish
6. **Go back to Cursor and save again**

---

## 🔧 **Why This Happens**

- **OneDrive** syncs files in real-time
- While syncing, OneDrive **locks the file** to prevent conflicts
- Your editor tries to save → **OneDrive has the lock** → Error ❌
- This is **harmless** but **annoying** for active development

---

## ✅ **Best Practice Solutions (Prevent Future Issues)**

### **Solution A: Always Keep Source Files Locally** ⭐ (Best)
Set all frequently-edited files to "Always keep on this device":

**Files to set:**
- `components/ui/*.tsx` (all UI components)
- `app/**/*.tsx` (all app files)
- `lib/*.ts` (all library files)
- `hooks/*.ts` (all hooks)

**How:**
1. Select multiple files in File Explorer (Ctrl+Click)
2. Right-click → **OneDrive** → **Always keep on this device**

### **Solution B: Exclude Build Folders from OneDrive**
These folders cause most lock issues:

**Folders to exclude:**
- `.next` / `.next-dev`
- `node_modules`
- `.git` (already handled by git)

**How:**
1. Right-click folder → **OneDrive** → **Free up space**
2. This keeps folder metadata but doesn't sync contents

### **Solution C: Move Project Outside OneDrive** (Nuclear Option)
If issues persist:

1. **Move project** to: `C:\Projects\ConnectSA-k9\`
2. Update your IDE workspace path
3. This **completely avoids** sync conflicts

---

## 🛠️ **Diagnostic Commands**

Check if file is locked:
```bash
node scripts/unlock-file.js components/ui/notification-popup.tsx
```

Check all component files:
```bash
node scripts/unlock-file.js components/ui/
```

---

## 📋 **Quick Checklist**

When you get this error:

- [ ] Pause OneDrive sync (fastest fix)
- [ ] Set file to "Always keep on this device"
- [ ] Close and reopen the file
- [ ] Try saving again
- [ ] If still fails, check file permissions

---

## 💡 **Pro Tips**

1. **Before major editing sessions**: Pause OneDrive sync for 2 hours
2. **Set all `.tsx` and `.ts` files** to "Always keep on device"
3. **OneDrive settings**: Sync → Advanced → Consider disabling auto-sync for dev folders
4. **Use `.gitignore`** - OneDrive doesn't need to sync node_modules, .next, etc.

---

## 🆘 **Still Not Working?**

1. **Check if file is open elsewhere**
   - Close any other programs that might have it open
   
2. **Check file permissions**
   - Right-click file → Properties → Security → Check your user has "Write" permission

3. **Try copying the file content**
   - Copy all content (Ctrl+A, Ctrl+C)
   - Close file
   - Delete the file
   - Create new file
   - Paste content (Ctrl+V)
   - Save

4. **Restart OneDrive**
   - Right-click OneDrive tray icon → Settings → Account → Unlink this PC
   - Relink if needed (usually not necessary)

---

**Remember:** This error is **NOT your fault** - it's OneDrive being overly protective! 🛡️

