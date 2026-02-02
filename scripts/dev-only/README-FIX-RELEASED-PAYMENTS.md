# Fix Released Payments Booking Status

This script fixes bookings that have released payments but still show "AWAITING_CONFIRMATION" status.

## Problem

When payments are released (status = RELEASED or COMPLETED), the booking status should also be updated to COMPLETED. However, some existing bookings may still have status = AWAITING_CONFIRMATION even though their payment has been released.

## Solution

This script finds all bookings where:
- Payment status is `RELEASED` or `COMPLETED`
- But booking status is NOT `COMPLETED`

And updates the booking status to `COMPLETED`.

## How to Run

### Option 1: Using Node.js Script (Recommended)

```bash
cd ConnectSA-k9
node scripts/fix-released-payments-booking-status.js
```

### Option 2: Using SQL Script

1. Connect to your database
2. Run the SQL script:
```bash
psql -d your_database_name -f scripts/fix-released-payments-booking-status.sql
```

Or copy and paste the SQL into your database client.

## What It Does

1. **Finds problematic bookings**: Searches for bookings with released payments but incorrect status
2. **Shows preview**: Displays what will be updated (SQL version only)
3. **Updates bookings**: Changes booking status from `AWAITING_CONFIRMATION` to `COMPLETED`
4. **Shows summary**: Reports how many bookings were updated

## Safety

- The script only updates bookings where payment is already released
- It doesn't affect bookings with other statuses
- Uses transactions (SQL version) to ensure data integrity
- Shows a preview before making changes (SQL version)

## Example Output

```
🔍 Finding bookings with released payments but incorrect booking status...
📊 Found 5 bookings that need to be updated
✅ Updated booking abc123 - Payment: RELEASED, Booking: AWAITING_CONFIRMATION → COMPLETED
✅ Updated booking def456 - Payment: RELEASED, Booking: AWAITING_CONFIRMATION → COMPLETED
...

📈 Summary:
   ✅ Successfully updated: 5 bookings
   ❌ Errors: 0 bookings
   📊 Total processed: 5 bookings

✅ Script completed successfully!
```

## Notes

- Run this script after deploying the fix to ensure existing data is corrected
- Safe to run multiple times (idempotent)
- Only affects bookings with released payments
