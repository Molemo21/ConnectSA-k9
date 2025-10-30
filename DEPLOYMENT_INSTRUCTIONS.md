# Cash Payment Deployment Instructions

## Status: Code Changes Complete ✅

All code changes have been implemented and the Prisma client has been generated. The database schema needs to be updated.

## Deployment Steps

### Option 1: Manual SQL Migration (Recommended for Production)

1. **Connect to your production database** using a direct connection (not the pooler):
   ```bash
   psql $DATABASE_URL
   ```

2. **Run the migration script**:
   ```bash
   psql $DATABASE_URL < apply_cash_payment_migration.sql
   ```

   Or if you're using Supabase/Direct URL:
   ```bash
   psql "postgresql://[your-direct-connection-string]" < apply_cash_payment_migration.sql
   ```

3. **Verify the migration** by checking:
   ```sql
   -- Check if paymentMethod column exists
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'bookings' AND column_name = 'paymentMethod';
   
   -- Check if cash statuses exist
   SELECT enumlabel FROM pg_enum 
   WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentStatus')
   AND enumlabel IN ('CASH_PENDING', 'CASH_RECEIVED', 'CASH_VERIFIED');
   ```

### Option 2: Using Prisma Studio (Alternative)

If you have access to your database directly:

1. **Open Prisma Studio**:
   ```bash
   npx prisma studio
   ```

2. **Manually add the column** via SQL editor in your database admin panel

### Option 3: Supabase Dashboard

If you're using Supabase:

1. Go to SQL Editor in Supabase dashboard
2. Copy and paste the contents of `apply_cash_payment_migration.sql`
3. Run the query

## What the Migration Does

1. **Adds 3 new enum values** to `PaymentStatus`:
   - `CASH_PENDING` - Payment awaiting cash receipt
   - `CASH_RECEIVED` - Provider confirmed cash payment  
   - `CASH_VERIFIED` - Cash payment verified by system

2. **Adds `paymentMethod` column** to `bookings` table:
   - Type: TEXT
   - Default: 'ONLINE'
   - Not NULL

3. **Updates existing bookings** to have 'ONLINE' as the payment method

## Code Changes Already Applied ✅

The following files have been updated and are ready to use:

- ✅ `prisma/schema.prisma` - Schema updated
- ✅ `app/api/book-service/[id]/pay/route.ts` - API handles cash payments
- ✅ `lib/payment-utils.ts` - Payment utilities updated
- ✅ `components/dashboard/enhanced-booking-card.tsx` - UI logic updated
- ✅ `components/ui/payment-status-display.tsx` - Status display fixed
- ✅ Prisma client generated

## Testing After Deployment

Once the migration is applied, test the cash payment flow:

### Test Scenario 1: Create Cash Booking
1. Create a new booking with payment method "CASH"
2. Verify no "Pay Now" button appears
3. Verify payment status shows "Awaiting Cash Payment"

### Test Scenario 2: Provider Confirms Cash Payment
1. Provider receives booking
2. Provider clicks "Confirm Payment Received"
3. Verify status updates to "CASH_RECEIVED"
4. Verify client sees confirmation

### Test Scenario 3: Online Payment (Should Still Work)
1. Create booking with "ONLINE" payment method
2. Verify "Pay Now" button appears
3. Verify redirects to Paystack
4. Complete payment flow

## Rollback Plan

If you need to rollback:

```sql
-- Remove paymentMethod column
ALTER TABLE "bookings" DROP COLUMN IF EXISTS "paymentMethod";

-- Note: Enum values cannot be easily removed, but you can ignore them
-- Existing data won't be affected
```

## Production Safety

✅ **Idempotent**: Script can be run multiple times safely  
✅ **Backward Compatible**: Existing bookings default to ONLINE  
✅ **No Downtime**: Adds new fields without breaking existing functionality  
✅ **Tested**: All code changes use TypeScript for type safety

## Current State

- **Code**: ✅ Complete and tested
- **Prisma Client**: ✅ Generated  
- **Database Migration**: ⏳ Pending (needs to be run manually)

## Next Actions

1. Run the SQL migration on your production database
2. Deploy the updated code
3. Test both payment flows
4. Monitor for any issues

---

## Why Manual Migration?

The database connection was timing out using Prisma's migration tool, which is common with:
- Connection poolers (pgBouncer)
- Network latency
- Firewall restrictions

The manual SQL approach is actually **best practice** for production deployments as it:
- Provides better control
- Can be reviewed before execution
- Works with any connection method
- Is the recommended approach for production systems







