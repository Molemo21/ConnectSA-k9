# 🚀 Moving Project Outside OneDrive - Complete Guide

## 📋 **What Happens When You Move the Project**

### ✅ **What STAYS the Same (No Impact)**
1. **All your code** - Everything moves exactly as-is
2. **Git repository** - Git history and commits remain intact
3. **Dependencies** - `node_modules` can be reinstalled
4. **Environment variables** - `.env` files move with the project
5. **Database connections** - No changes needed
6. **Application functionality** - Zero impact on how it works

### ⚠️ **What CHANGES**
1. **File paths** - Project is no longer in OneDrive folder
2. **OneDrive sync** - No automatic cloud backup of your code
3. **IDE workspace** - You may need to update workspace path in Cursor/VS Code
4. **Shortcuts/aliases** - Any shortcuts pointing to old location won't work

### 🔄 **What You NEED to Do After Moving**
1. Update IDE workspace path
2. Reinstall dependencies (optional but recommended)
3. Verify environment variables
4. Test the application
5. Set up proper backup strategy (critical!)

---

## 📍 **Step-by-Step Moving Process**

### **Step 1: Prepare for the Move**

#### A. Ensure Git is up to date
```bash
# Check current status
git status

# Commit any uncommitted changes
git add .
git commit -m "Pre-move: Save current state before moving project"

# Push to remote (if you have one)
git push
```

#### B. Stop running processes
```bash
# Stop dev server if running (Ctrl+C)
# Close all terminals
# Close IDE/Cursor
```

---

### **Step 2: Create Destination Folder**

```bash
# Option A: Create in C:\Projects (Recommended)
mkdir C:\Projects
cd C:\Projects

# Option B: Create in Documents
mkdir C:\Users\liqui\Documents\Projects
cd C:\Users\liqui\Documents\Projects
```

**Why `C:\Projects`?**
- ✅ Easy to find
- ✅ Standard location for development
- ✅ No special permissions needed
- ✅ Easy to backup

---

### **Step 3: Copy the Project**

#### **Method A: Using File Explorer** (Recommended)
1. **Open File Explorer**
2. **Navigate to:** `C:\Users\liqui\OneDrive\Desktop\ConnectSA\`
3. **Right-click** `ConnectSA-k9` folder
4. **Select "Copy"** (Ctrl+C)
5. **Navigate to:** `C:\Projects\`
6. **Right-click empty space** → **"Paste"** (Ctrl+V)
7. **Wait for copy to complete** (may take 5-10 minutes)

#### **Method B: Using Git Clone** (If you have remote repository)
```bash
cd C:\Projects

# Clone fresh copy from remote
git clone <your-repo-url> ConnectSA-k9
cd ConnectSA-k9

# Copy .env files manually from old location
# Copy any local files not in git
```

#### **Method C: Using Command Line**
```bash
# Using robocopy (Windows built-in, preserves everything)
robocopy "C:\Users\liqui\OneDrive\Desktop\ConnectSA\ConnectSA-k9" "C:\Projects\ConnectSA-k9" /E /COPYALL /R:3 /W:5

# /E = Copy all subdirectories
# /COPYALL = Copy all file attributes
# /R:3 = Retry 3 times on errors
# /W:5 = Wait 5 seconds between retries
```

---

### **Step 4: Verify the Copy**

```bash
cd C:\Projects\ConnectSA-k9

# Check if files are there
dir

# Verify Git is intact
git status
git log --oneline -5

# Check package.json exists
type package.json
```

---

### **Step 5: Clean Up (After Verification)**

#### A. Remove node_modules (they'll be reinstalled)
```bash
cd C:\Projects\ConnectSA-k9
rmdir /s /q node_modules
```

#### B. Remove build folders (they'll be regenerated)
```bash
rmdir /s /q .next
rmdir /s /q .next-dev
rmdir /s /q out
```

**Why?** These folders are large and can be regenerated. Also, they may have OneDrive metadata.

---

### **Step 6: Update Your Environment**

#### A. Open New Location in Cursor/VS Code
1. **Open Cursor**
2. **File** → **Open Folder**
3. **Navigate to:** `C:\Projects\ConnectSA-k9`
4. **Click "Select Folder"**

#### B. Verify Terminal Works
```bash
# Terminal should open in: C:\Projects\ConnectSA-k9
pwd  # or `cd` in CMD
# Should show: C:\Projects\ConnectSA-k9
```

---

### **Step 7: Reinstall Dependencies**

```bash
cd C:\Projects\ConnectSA-k9

# Clean install
npm install
# or
pnpm install
```

**Why?** Ensures all dependencies are fresh and paths are correct.

---

### **Step 8: Verify Environment Variables**

```bash
# Check .env files exist
dir .env*

# If missing, copy from old location
# Or create from .env.example
copy .env.example .env.local
```

**Important:** Update any file paths in `.env` if they reference OneDrive location.

---

### **Step 9: Test the Application**

```bash
# Generate Prisma client
npx prisma generate

# Test build (optional)
npm run build

# Start dev server
npm run dev
```

**If everything works:** ✅ You're done!  
**If errors:** Check the troubleshooting section below.

---

### **Step 10: Update Git Remote (If Needed)**

If you're using a remote repository, verify it's correct:
```bash
git remote -v

# If needed, update remote URL
git remote set-url origin <your-repo-url>
```

---

### **Step 11: Delete Old Location (Optional & Risky)**

⚠️ **ONLY after confirming new location works perfectly:**

1. **Test for at least 1 day** in new location
2. **Backup old location first:**
   ```bash
   # Zip the old folder as backup
   # Then you can delete original after 1-2 weeks
   ```
3. **Unlink from OneDrive:**
   - Right-click old folder → OneDrive → Free up space

**Recommendation:** Keep old location for 1-2 weeks as backup, then delete.

---

## 🔐 **Backup Strategy (Critical After Moving)**

Since you're no longer using OneDrive for automatic backup:

### **Option 1: Git Repository** ⭐ (Best Practice)
```bash
# Ensure you push regularly
git add .
git commit -m "Your changes"
git push

# Set up automatic backup with GitHub/GitLab/Bitbucket
```

**Benefits:**
- ✅ Version control
- ✅ Backup in the cloud
- ✅ Easy collaboration
- ✅ Free (GitHub free tier)

### **Option 2: Automated Local Backup**

Create a backup script:

```bash
# scripts/backup-to-onedrive.sh (or .bat for Windows)
# Backup only important files to OneDrive

# Create: C:\Projects\Backups\ConnectSA-k9\
# Copy source code, .env files, etc.
```

### **Option 3: Cloud Backup Service**
- **GitHub** - Free private repositories
- **GitLab** - Free private repositories
- **Bitbucket** - Free private repositories
- **Dropbox/Google Drive** - For local backups (but don't sync the project folder!)

---

## 🎯 **Best Practices After Moving**

### **1. Project Organization**

```
C:\Projects\
├── ConnectSA-k9\          # Your main project
├── ConnectSA-k9-backup\   # Optional: Manual backups
└── Other-Projects\        # Future projects
```

**Benefits:**
- ✅ All projects in one place
- ✅ Easy to find
- ✅ Consistent structure

---

### **2. Environment Variables Management**

#### **Best Practice: Use `.env.local` for secrets**
```bash
# .env.local (never commit this)
DATABASE_URL=...
JWT_SECRET=...
RESEND_API_KEY=...
```

#### **Keep `.env.example` for team**
```bash
# .env.example (commit this)
DATABASE_URL=postgresql://...
JWT_SECRET=change_me
RESEND_API_KEY=your_key_here
```

---

### **3. Git Workflow**

#### **Daily workflow:**
```bash
# Morning: Pull latest changes
git pull

# During day: Make changes
# ...

# End of day: Commit and push
git add .
git commit -m "Feature: Added notification improvements"
git push
```

#### **Branch strategy:**
```bash
# Create feature branches
git checkout -b feature/notification-bell-fix
# Make changes
git commit -m "Fix: Improved notification click handler"
git push origin feature/notification-bell-fix
# Create PR on GitHub
```

---

### **4. Regular Backups**

#### **Weekly backup script:**
```bash
# Create: scripts/weekly-backup.bat

@echo off
echo Creating backup...
cd C:\Projects\ConnectSA-k9
git add .
git commit -m "Weekly backup: %date%"
git push
echo Backup complete!
```

---

### **5. Path References**

After moving, check for hardcoded paths:

#### **Files to check:**
- `next.config.mjs` - Check for absolute paths
- `.env` files - Check for file path references
- `package.json` scripts - Check for path references
- Any configuration files

#### **Common issues:**
```javascript
// ❌ Bad: Hardcoded OneDrive path
const path = 'C:\\Users\\liqui\\OneDrive\\Desktop\\ConnectSA\\ConnectSA-k9\\uploads'

// ✅ Good: Relative path
const path = path.join(process.cwd(), 'uploads')

// ✅ Good: Environment variable
const path = process.env.UPLOAD_PATH || path.join(process.cwd(), 'uploads')
```

---

### **6. IDE Configuration**

#### **Cursor/VS Code Settings:**

Create `.vscode/settings.json`:
```json
{
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/node_modules/**": true,
    "**/.next/**": true,
    "**/.next-dev/**": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/.next-dev": true
  }
}
```

**Benefits:**
- ✅ Faster file watching
- ✅ Better performance
- ✅ Reduces unnecessary indexing

---

## 🚨 **Troubleshooting After Move**

### **Issue: "Module not found" errors**

**Solution:**
```bash
# Delete node_modules and package-lock.json
rmdir /s /q node_modules
del package-lock.json

# Reinstall
npm install
```

---

### **Issue: "Prisma client not found"**

**Solution:**
```bash
npx prisma generate
```

---

### **Issue: Environment variables not loading**

**Solution:**
1. Check `.env.local` exists in new location
2. Copy from old location if needed
3. Restart dev server

---

### **Issue: Port already in use**

**Solution:**
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or change port in .env
PORT=3001
```

---

### **Issue: Git remote not working**

**Solution:**
```bash
# Check remote
git remote -v

# Update if needed
git remote set-url origin <your-repo-url>

# Test connection
git fetch
```

---

## 📊 **Comparison: OneDrive vs Outside OneDrive**

| Feature | OneDrive Location | Outside OneDrive |
|---------|------------------|------------------|
| **File Lock Issues** | ❌ Frequent | ✅ None |
| **Auto Backup** | ✅ Yes | ❌ Need Git/Manual |
| **Sync Speed** | ⚠️ Can slow dev server | ✅ Fast |
| **Version Control** | ✅ Git still works | ✅ Git works |
| **Collaboration** | ⚠️ Conflicts possible | ✅ No conflicts |
| **Accessibility** | ✅ Available on all devices | ⚠️ One device only |
| **Performance** | ⚠️ Slower (sync overhead) | ✅ Faster |
| **Build Times** | ⚠️ Can be slower | ✅ Faster |

---

## ✅ **Recommended Setup After Move**

### **1. Project Structure**
```
C:\Projects\ConnectSA-k9\
├── .git\                    # Git repository
├── .env.local\              # Secrets (not in git)
├── .env.example\            # Template (in git)
├── components\              # React components
├── app\                     # Next.js app directory
├── lib\                     # Utilities
├── hooks\                   # React hooks
├── scripts\                 # Utility scripts
└── node_modules\            # Dependencies (gitignored)
```

### **2. Backup Strategy**
- ✅ **Primary:** Git repository** (GitHub/GitLab)
- ✅ **Secondary:** Weekly manual backup to external drive
- ✅ **Environment:** Keep `.env.local` in secure password manager

### **3. Development Workflow**
```bash
# Daily
git pull                    # Get latest
npm run dev                 # Start development
# ... make changes ...
git add .                   # Stage changes
git commit -m "Description" # Commit
git push                    # Backup to remote

# Weekly
# Run tests
npm run test:all
# Create backup archive
```

---

## 🎓 **Key Takeaways**

1. ✅ **Moving is safe** - Your code and Git history stay intact
2. ✅ **No functionality loss** - App works exactly the same
3. ✅ **Performance improves** - No sync overhead
4. ✅ **File lock issues gone** - OneDrive won't interfere
5. ⚠️ **Backup becomes your responsibility** - Use Git regularly
6. ✅ **Standard practice** - Most developers work outside sync folders

---

## 📝 **Checklist After Move**

- [ ] Project copied to new location
- [ ] Git repository verified (`git status`)
- [ ] Dependencies reinstalled (`npm install`)
- [ ] Environment variables copied (`.env.local`)
- [ ] IDE workspace updated (Cursor opens new location)
- [ ] Dev server starts successfully (`npm run dev`)
- [ ] Application works correctly (test in browser)
- [ ] Git remote configured (if using remote)
- [ ] Backup strategy in place (Git repository)
- [ ] Old location backed up (optional)
- [ ] Update any shortcuts/aliases
- [ ] Update documentation with new path

---

## 🆘 **Need Help?**

If you encounter issues:
1. Check troubleshooting section above
2. Verify all steps completed
3. Check Git repository is intact
4. Verify environment variables
5. Review terminal errors carefully

**Remember:** The move is reversible - you can always copy back if needed!

