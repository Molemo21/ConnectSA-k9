# Admin Dashboard - User & Provider Verification Checklist

## 🎯 Complete Database Inventory

### **👥 USERS - Total: 18**

**What SHOULD appear in "Manage Users" tab:**

#### **Page 1 (Users 1-10):**
1. ✓ **Qhawe Yamkela Mlengana** - yamkelaqmlengana@gmail.com - CLIENT - ACTIVE
2. ✓ **Asiphe Sikrenya** - asiphe@proliinkconnect.co.za - CLIENT - ACTIVE
3. ✓ **System Administrator** - admin@proliinkconnect.co.za - ADMIN - ACTIVE
4. ✓ **asiphe** - asiphesikrenya638@gmail.com - PROVIDER - ACTIVE
5. ✓ **Noxolo Mjaks** - nmjokovane@gmail.com - PROVIDER - ACTIVE
6. ✓ **Zenande** - zenandegoso@icloud.com - PROVIDER - ACTIVE
7. ✓ **bubele** - bubelembizenipearllemon@gmail.com - PROVIDER - ACTIVE
8. ✓ **Noxolo** - bubelembizeni6@gmail.com - PROVIDER - ACTIVE
9. ✓ **Sechaba Thomas Nakin** - molemonakin08@gmail.com - PROVIDER - ACTIVE
10. ✓ **Benard Nakin** - molemo@proliinkconnect.co.za - PROVIDER - ACTIVE

#### **Page 2 (Users 11-18):**
11. ✓ **Test User Localhost** - test-localhost@example.com - CLIENT - INACTIVE
12. ✓ **Nanga Dlanga** - dlanga@gmail.com - CLIENT - INACTIVE (2 bookings)
13. ✓ **Quick Test User** - quick.test.1756719066595@example.com - CLIENT - INACTIVE
14. ✓ **Dodo Adonis** - nontlahlaadonis6@gmail.com - PROVIDER - ACTIVE
15. ✓ **Admin User** - admin@example.com - ADMIN - ACTIVE
16. ✓ **Thabang Nakin** - thabangnakin17@gmail.com - PROVIDER - ACTIVE
17. ✓ **Keitumetse Faith Seroto** - bubelembizeni32@gmail.com - PROVIDER - ACTIVE
18. ✓ **Molemo Nakin** - molemonakin21@gmail.com - CLIENT - ACTIVE (60 bookings, R 900 spent)

---

### **🏢 PROVIDERS - Total: 9**

**What SHOULD appear in "Approve Providers" tab:**

#### **All Providers (Fits on Page 1):**

**PENDING (2 providers - Should have Approve/Reject buttons):**
1. ✓ **asiphe** (Nakin Traders) - asiphesikrenya638@gmail.com - PENDING
   - 0 bookings, R 0.00 earnings, 0.0 rating

2. ✓ **Noxolo** (Nakin Traders) - bubelembizeni6@gmail.com - PENDING
   - 0 bookings, R 0.00 earnings, 0.0 rating

**INCOMPLETE (4 providers):**
3. ✓ **Noxolo Mjaks** (No business name) - nmjokovane@gmail.com - INCOMPLETE
   - 0 bookings, R 0.00 earnings, 0.0 rating

4. ✓ **Zenande** (No business name) - zenandegoso@icloud.com - INCOMPLETE
   - 0 bookings, R 0.00 earnings, 0.0 rating

5. ✓ **bubele** (No business name) - bubelembizenipearllemon@gmail.com - INCOMPLETE
   - 0 bookings, R 0.00 earnings, 0.0 rating

6. ✓ **Sechaba Thomas Nakin** (Nakin Traders) - molemonakin08@gmail.com - INCOMPLETE
   - 0 bookings, R 0.00 earnings, 0.0 rating

**APPROVED (3 providers - Active with earnings):**
7. ✓ **Dodo Adonis** (John's services) - nontlahlaadonis6@gmail.com - APPROVED
   - 13 bookings, **R 386.10** earnings, 3.0 rating (1 review)

8. ✓ **Thabang Nakin** (John's services) - thabangnakin17@gmail.com - APPROVED
   - 15 bookings, **R 2,268.00** earnings, 4.8 rating (5 reviews) ⭐

9. ✓ **Keitumetse Faith Seroto** (No business name) - bubelembizeni32@gmail.com - APPROVED
   - 34 bookings, **R 1,603.80** earnings, 3.7 rating (6 reviews)

---

## 📋 Verification Steps

### **Step 1: Verify Users Tab**

1. **Navigate to Admin Dashboard** - `/admin/dashboard`
2. **Click "Manage Users"** button (Blue button in Quick Actions)
3. **Check the header** - Should say: "Total users: 18"
4. **Count the rows** - Should see 10 users on first page
5. **Verify first user** - Should be "Qhawe Yamkela Mlengana"
6. **Click "Next" or "Page 2"** - Should see remaining 8 users
7. **Verify last user** - Should be "Molemo Nakin" with 60 bookings and R 900 spent

#### **Check Filters Work:**
- [ ] Filter by Status = ACTIVE → Should show 15 users
- [ ] Filter by Status = INACTIVE → Should show 3 users
- [ ] Filter by Role = CLIENT → Should show 6 users
- [ ] Filter by Role = PROVIDER → Should show 10 users
- [ ] Filter by Role = ADMIN → Should show 2 users
- [ ] Search "molemo" → Should find users with "molemo" in name/email

---

### **Step 2: Verify Providers Tab**

1. **Click "Approve Providers"** button (Purple button in Quick Actions)
2. **Check the header** - Should say: "Total providers: 9"
3. **Count the rows** - Should see all 9 providers (single page)
4. **Verify PENDING providers** - Should see 2:
   - asiphe (Nakin Traders)
   - Noxolo (Nakin Traders)
5. **Check Approve/Reject buttons** - Should appear for PENDING providers only
6. **Verify earnings formatting** - Should show:
   - Dodo Adonis: R 386.10 (or R 386)
   - Thabang Nakin: R 2,268.00 (or R 2,268) ⭐ Top earner
   - Keitumetse Faith Seroto: R 1,603.80 (or R 1,604)

#### **Check Filters Work:**
- [ ] Filter by Status = APPROVED → Should show 3 providers
- [ ] Filter by Status = PENDING → Should show 2 providers
- [ ] Filter by Status = INCOMPLETE → Should show 4 providers
- [ ] Search "nakin" → Should find 4 providers with "nakin" in name/business
- [ ] Search "john" → Should find 2 providers (John's services)

---

## 🔍 Visual Verification Guide

### **Users Tab - What to Look For:**

```
┌─────────────────────────────────────────────────────────────┐
│ User Management                                    [Refresh] │
│ Total users: 18                                              │
├─────────────────────────────────────────────────────────────┤
│ [Search box] [Status filter] [Role filter]                  │
├─────────────────────────────────────────────────────────────┤
│ Name               Email                Role      Status     │
├─────────────────────────────────────────────────────────────┤
│ Qhawe Yamkela...   yamkelaqmleng...   CLIENT    ACTIVE     │
│ Asiphe Sikrenya    asiphe@proli...    CLIENT    ACTIVE     │
│ System Admin...    admin@proliink...  ADMIN     ACTIVE     │
│ asiphe             asiphesikren...    PROVIDER  ACTIVE     │
│ Noxolo Mjaks       nmjokovane@g...    PROVIDER  ACTIVE     │
│ Zenande            zenandegoso@...    PROVIDER  ACTIVE     │
│ bubele             bubelembizenip...  PROVIDER  ACTIVE     │
│ Noxolo             bubelembizeni6...  PROVIDER  ACTIVE     │
│ Sechaba Thomas...  molemonakin08...   PROVIDER  ACTIVE     │
│ Benard Nakin       molemo@proliink... PROVIDER  ACTIVE     │
├─────────────────────────────────────────────────────────────┤
│ Page 1 of 2                               [Previous] [Next] │
└─────────────────────────────────────────────────────────────┘
```

### **Providers Tab - What to Look For:**

```
┌──────────────────────────────────────────────────────────────────┐
│ Provider Management                                   [Refresh]  │
│ Total providers: 9                                               │
├──────────────────────────────────────────────────────────────────┤
│ [Search box] [Status filter] [Verification filter]              │
├──────────────────────────────────────────────────────────────────┤
│ Business         Name      Status      Earnings   Rating Actions│
├──────────────────────────────────────────────────────────────────┤
│ Nakin Traders    asiphe    PENDING     R 0.00     0.0  [Approve]│
│ (No name)        Noxolo... INCOMPLETE  R 0.00     0.0  [View]   │
│ (No name)        Zenande   INCOMPLETE  R 0.00     0.0  [View]   │
│ (No name)        bubele    INCOMPLETE  R 0.00     0.0  [View]   │
│ Nakin Traders    Noxolo    PENDING     R 0.00     0.0  [Approve]│
│ Nakin Traders    Sechaba.. INCOMPLETE  R 0.00     0.0  [View]   │
│ John's services  Dodo...   APPROVED    R 386.10   3.0  [View]   │
│ John's services  Thabang.. APPROVED    R 2,268.00 4.8⭐ [View]   │
│ (No name)        Keitum... APPROVED    R 1,603.80 3.7  [View]   │
├──────────────────────────────────────────────────────────────────┤
│ Page 1 of 1                                     [Previous][Next] │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🧪 **Testing Scenarios:**

### **Scenario 1: All Users Visible**
1. Click "Manage Users"
2. **Expected:** 10 users on page 1
3. **Verify:** Can navigate to page 2 to see remaining 8 users
4. **Total displayed:** 18 users

### **Scenario 2: Filter Users by Role**
1. Click filter: Role = PROVIDER
2. **Expected:** 10 providers shown
3. **Names should include:** asiphe, Noxolo Mjaks, Zenande, bubele, Noxolo, Sechaba, Benard, Dodo, Thabang, Keitumetse

### **Scenario 3: All Providers Visible**
1. Click "Approve Providers"
2. **Expected:** All 9 providers on page 1
3. **Pending (2):** asiphe, Noxolo - Should have Approve/Reject buttons
4. **Approved (3):** Dodo, Thabang, Keitumetse - Should show earnings

### **Scenario 4: Filter Providers by Status**
1. Click filter: Status = PENDING
2. **Expected:** 2 providers (asiphe, Noxolo)
3. **Verify:** Both have "Approve" and "Reject" buttons

---

## ✅ **Expected vs Actual:**

### **Users Tab:**
| Metric | Database | Should Show | Check |
|--------|----------|-------------|-------|
| Total Users | 18 | 18 | ✓ |
| Page 1 | 10 | 10 | ✓ |
| Page 2 | 8 | 8 | ✓ |
| ACTIVE | 15 | 15 | ✓ |
| INACTIVE | 3 | 3 | ✓ |
| CLIENT role | 6 | 6 | ✓ |
| PROVIDER role | 10 | 10 | ✓ |
| ADMIN role | 2 | 2 | ✓ |

### **Providers Tab:**
| Metric | Database | Should Show | Check |
|--------|----------|-------------|-------|
| Total Providers | 9 | 9 | ✓ |
| Page 1 | 9 | 9 | ✓ |
| PENDING | 2 | 2 | ✓ |
| APPROVED | 3 | 3 | ✓ |
| INCOMPLETE | 4 | 4 | ✓ |
| With earnings | 3 | 3 | ✓ |
| Total earnings | R 4,257.90 | R 4,257.90 | ✓ |

---

## 🔍 **Troubleshooting:**

### **If count is wrong:**
1. Check browser console for errors
2. Check Network tab - look at `/api/admin/users` or `/api/admin/providers` response
3. Verify the `totalCount` in the API response matches database count (18 for users, 9 for providers)

### **If users/providers are missing:**
1. Check if pagination is working - click "Next" to see page 2
2. Check if filters are applied - reset filters to "All"
3. Clear search box
4. Click "Refresh" button

### **If data looks wrong:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Check terminal for API errors
3. Verify database connection

---

## 🎯 **Quick Verification Command:**

Run this to see exactly what should appear:

```bash
node scripts/verify-all-users-providers.js
```

This will show you:
- Complete list of all 18 users
- Complete list of all 9 providers
- What should appear on each page
- Breakdown by status and role

---

## ✅ **Success Criteria:**

The admin dashboard is working correctly if:

- [ ] **Users tab shows:** "Total users: 18"
- [ ] **Page 1 shows:** 10 users (Qhawe → Benard Nakin)
- [ ] **Page 2 shows:** 8 users (Test User → Molemo Nakin)
- [ ] **Pagination works:** Can navigate between pages
- [ ] **All 18 users** are accounted for across both pages

- [ ] **Providers tab shows:** "Total providers: 9"
- [ ] **Page 1 shows:** All 9 providers
- [ ] **PENDING providers (2):** Have Approve/Reject buttons
- [ ] **APPROVED providers (3):** Show correct earnings in ZAR
- [ ] **All 9 providers** are accounted for

- [ ] **Currency displays:** All amounts show "R" not "$"
- [ ] **Search works:** Can find specific users/providers
- [ ] **Filters work:** Can filter by status and role
- [ ] **Actions work:** Approve, suspend, etc.

---

## 🎉 **Database Verified:**

✅ **18 users** in database  
✅ **9 providers** in database  
✅ **All data accessible**  
✅ **Pagination logic correct**  
✅ **Currency consistent (ZAR)**  

**Now verify they all appear in the UI!** 🚀
