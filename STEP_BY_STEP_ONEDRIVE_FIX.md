# 📋 Step-by-Step Guide: Fix OneDrive File Lock

## **Recommended Solution: Set File to "Always Keep on This Device"**

This prevents OneDrive from locking files during sync, solving the save issue permanently.

---

## **Step-by-Step Instructions**

### **Step 1: Open File Explorer** 📁

1. **Press `Windows Key + E`** (opens File Explorer)
   - OR
2. **Click the File Explorer icon** in your taskbar
   - OR
3. **Right-click Start button** → Select "File Explorer"

---

### **Step 2: Navigate to Your Project Folder** 🗂️

1. In File Explorer, go to the address bar at the top
2. **Copy and paste this path:**
   ```
   C:\Users\liqui\OneDrive\Desktop\ConnectSA\ConnectSA-k9
   ```
3. **Press Enter**

   You should now see your project files.

---

### **Step 3: Find the File** 🔍

1. **Scroll down or search** for `next.config.mjs`
   - You can type `next.config` in the search box to find it quickly

2. **Verify you found the right file:**
   - File name: `next.config.mjs`
   - Location: `ConnectSA-k9` folder

---

### **Step 4: Right-Click the File** 🖱️

1. **Right-click** on `next.config.mjs`
   - Make sure you right-click directly on the file (not empty space)

2. **A context menu will appear** with various options

---

### **Step 5: Access OneDrive Options** ☁️

1. In the context menu, **look for "OneDrive"** option
   - It may appear as:
     - "OneDrive" with a submenu arrow (▶)
     - Or directly visible options

2. **Hover over or click "OneDrive"**
   - A submenu will appear with OneDrive-specific options

---

### **Step 6: Select "Always Keep on This Device"** ✅

1. In the OneDrive submenu, **click "Always keep on this device"**
   - This option tells OneDrive to:
     - Keep a local copy permanently
     - Reduce sync conflicts
     - Prevent file locking during development

2. **Wait 5-10 seconds** for OneDrive to process the change
   - You may see a brief loading indicator
   - The file icon might change slightly (to show it's "always available")

---

### **Step 7: Verify the Setting** ✔️

**Method 1: Check File Properties**
1. **Right-click `next.config.mjs`** again
2. **Select "Properties"**
3. **Look at the "Attributes"** section
4. You should see the file is now marked for local storage

**Method 2: Check OneDrive Icon**
1. Look at the file icon in File Explorer
2. If you see a **green checkmark** or **solid cloud icon** (instead of syncing arrows), it's working

---

### **Step 8: Test Saving** ✏️

1. **Go back to Cursor** (your code editor)
2. **Make a small change** to `next.config.mjs`
   - Example: Add a comment `// test`
3. **Press `Ctrl + S`** (or File → Save)
4. **The file should save successfully!** ✅

---

## **Alternative Method: If "OneDrive" Option Doesn't Appear**

Sometimes the OneDrive context menu might not show up. Here's an alternative:

### **Method A: Via OneDrive Settings**

1. **Right-click OneDrive icon** in system tray (bottom-right corner)
2. **Click "Settings"** or "Help & Settings" → "Settings"
3. **Go to "Sync and backup"** tab
4. **Click "Advanced settings"**
5. **Look for "Files On-Demand" settings**
6. **Find your file in the list** and set it to "Always available"

### **Method B: Via File Explorer Menu**

1. **Right-click `next.config.mjs`**
2. **Select "Properties"**
3. **Click "Advanced"** button
4. **Check/uncheck** "File is ready for archiving" (may vary by Windows version)
5. **Click OK**

---

## **Quick Verification Checklist** ✅

After completing the steps, verify:

- [ ] File is accessible in File Explorer
- [ ] Right-click shows OneDrive options
- [ ] "Always keep on this device" is selected/active
- [ ] Can save file in Cursor without errors
- [ ] File saves successfully

---

## **Troubleshooting** 🔧

### **Problem: "OneDrive" option not in context menu**

**Solution:**
1. Make sure OneDrive is installed and running
2. Check system tray for OneDrive icon
3. Try right-clicking in a different location
4. Use Alternative Method A (OneDrive Settings)

### **Problem: File still won't save after setting**

**Solution:**
1. **Close the file in Cursor** completely
2. **Wait 30 seconds** for OneDrive to sync
3. **Reopen the file** in Cursor
4. **Try saving again**

If still not working:
- Pause OneDrive sync temporarily (system tray → Pause syncing)
- Save the file
- Resume OneDrive sync

### **Problem: Can't find the project folder**

**Solution:**
1. Open Cursor
2. Right-click on `next.config.mjs` in the file tree
3. Select "Reveal in File Explorer"
4. This will open the folder directly

---

## **Visual Guide References** 👀

### **What You Should See:**

**File Explorer:**
```
ConnectSA-k9/
├── next.config.mjs  ← Right-click here
├── package.json
├── server.js
└── ...
```

**Right-Click Menu:**
```
Open
Open with Code
Properties
OneDrive ▶          ← Click here
  ├─ Always keep on this device  ← Select this
  ├─ Free up space
  └─ View online
```

---

## **Benefits After Completing This Fix** ✨

✅ **No more save errors** - File won't be locked by OneDrive  
✅ **Faster saves** - No waiting for sync  
✅ **Better development experience** - Edit without interruptions  
✅ **Permanent solution** - Works for future edits  

---

## **Next Steps After Fix** 🚀

1. **Test editing other config files** (like `package.json`)
2. **Consider setting other frequently-edited files** to "Always keep on this device":
   - `server.js`
   - `.env` files
   - Other config files you edit often

---

## **Need Help?** 💬

If you encounter any issues:
1. Check the Troubleshooting section above
2. Verify OneDrive is running (system tray icon)
3. Try pausing OneDrive sync temporarily as a workaround

---

**🎉 Once completed, you should be able to save `next.config.mjs` without any OneDrive lock errors!**




