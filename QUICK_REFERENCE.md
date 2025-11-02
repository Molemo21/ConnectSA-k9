# ⚡ Quick Reference: Fix OneDrive File Lock

## **Fastest Method (30 seconds)**

1. **Right-click OneDrive icon** (system tray, bottom-right)
2. **Pause syncing** → Choose "2 hours"
3. **Save your file** in Cursor
4. **Resume sync** after saving

---

## **Permanent Fix (2 minutes)**

1. **Open File Explorer** (`Windows + E`)
2. **Navigate to:** `C:\Users\liqui\OneDrive\Desktop\ConnectSA\ConnectSA-k9`
3. **Right-click `next.config.mjs`**
4. **OneDrive** → **"Always keep on this device"**
5. **Wait 10 seconds**
6. **Test save** in Cursor

---

## **Alternative: Use Terminal**

If editor still fails, save via terminal:

```bash
# Edit file, then save via terminal:
cat > next.config.mjs << 'EOF'
[paste your edited content here]
EOF
```

---

## **Detailed Guide**

See `STEP_BY_STEP_ONEDRIVE_FIX.md` for full instructions with screenshots references.




