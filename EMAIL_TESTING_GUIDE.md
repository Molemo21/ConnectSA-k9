# 📧 Email Delivery Testing Guide for Non-Gmail Addresses

## Overview

This guide will help you test email delivery to non-Gmail addresses (Outlook, Hotmail, Yahoo, etc.) to ensure the verification emails are being sent correctly.

---

## 🚀 Quick Test (Recommended)

The fastest way to test email delivery:

### Step 1: Run Quick Test with Your Email

Replace `your-email@outlook.com` with your actual test email address:

```bash
# Test with Outlook
node scripts/test-email-quick.js your-email@outlook.com

# Test with Yahoo
node scripts/test-email-quick.js your-email@yahoo.com

# Test with Hotmail
node scripts/test-email-quick.js your-email@hotmail.com

# Test with any other email
node scripts/test-email-quick.js your-email@example.com
```

### Step 2: Check Your Email

1. Check your **inbox** for the test email
2. **Also check your SPAM/JUNK folder** (very important!)
3. The email should arrive within 1-2 minutes

### Step 3: Verify Results

**If email arrives:**
✅ Email delivery is working! The issue may have been fixed.

**If email doesn't arrive:**
❌ Continue with the troubleshooting steps below.

---

## 🔧 Comprehensive Test Suite

For a more thorough test covering signup and resend flows:

### Step 1: Edit Test Script

Open `scripts/test-email-non-gmail-delivery.js` and update the test email addresses:

```javascript
const TEST_EMAIL_ADDRESSES = {
  outlook: 'your-actual-email@outlook.com',   // REPLACE THIS
  hotmail: 'your-actual-email@hotmail.com',   // REPLACE THIS
  yahoo: 'your-actual-email@yahoo.com',       // REPLACE THIS
  gmail: 'your-actual-email@gmail.com',       // REPLACE THIS (for comparison)
};
```

### Step 2: Run Comprehensive Tests

```bash
node scripts/test-email-non-gmail-delivery.js
```

This will test:
1. Direct Resend API email sending
2. Signup flow with verification email
3. Resend verification functionality

### Step 3: Review Results

The script will show detailed results for each provider and test type.

---

## 🔍 Troubleshooting Email Delivery Issues

### Issue 1: Domain Not Verified

**Symptom:** Error message includes "domain" or "not verified"

**Solution:**
1. Go to https://resend.com/domains
2. Check if `app.proliinkconnect.co.za` is verified
3. If not, add these DNS records to your domain:

```
Type: TXT
Name: @
Value: [Verification code from Resend]

Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all

Type: CNAME
Name: resend._domainkey
Value: [DKIM value from Resend]
```

4. Wait 5-10 minutes for DNS propagation
5. Click "Verify" in Resend dashboard

### Issue 2: Invalid API Key

**Symptom:** "authentication" error

**Solution:**
1. Verify your API key in `.env` file:
   ```
   RESEND_API_KEY=re_SDXQnpH5_EhXAJihxYgJRRgug7xjs6qcX
   ```
2. Check in Resend dashboard: https://resend.com/api-keys
3. Create a new API key if needed

### Issue 3: Emails Going to Spam

**Symptom:** Emails arrive in spam/junk folder

**Solution:**
1. Add SPF record:
   ```
   v=spf1 include:_spf.resend.com ~all
   ```
2. Add DMARC record:
   ```
   v=DMARC1; p=none; rua=mailto:admin@proliinkconnect.co.za
   ```
3. Configure DKIM in Resend dashboard
4. Ask recipients to mark email as "Not Spam"
5. Build sender reputation over time

### Issue 4: Rate Limiting

**Symptom:** "429 Too Many Requests" error

**Solution:**
1. Wait 5-10 minutes before retrying
2. Check rate limits in Resend dashboard
3. Upgrade Resend plan if needed

### Issue 5: Specific Provider Blocking (Outlook/Yahoo)

**Symptom:** Emails work for some providers but not others

**Solutions for Outlook/Hotmail:**
1. Check Microsoft SNDS (Smart Network Data Services)
2. Ensure SPF and DKIM are configured
3. Monitor complaint rates in Resend
4. Contact Microsoft postmaster if blocked

**Solutions for Yahoo:**
1. Register with Yahoo Email Deliverability
2. Implement feedback loops
3. Maintain low complaint rates (<0.1%)
4. Use consistent sending patterns

### Issue 6: No Error But No Email

**Symptom:** API returns success but email doesn't arrive

**Solution:**
1. Check Resend dashboard: https://resend.com/emails
2. Look for the email by Message ID
3. Check delivery status and any bounce messages
4. Verify recipient email address is correct
5. Ask recipient to check all folders (inbox, spam, junk, promotions)

---

## 📊 Checking Email Delivery Status in Resend

### Via Resend Dashboard:

1. Go to https://resend.com/emails
2. Find your email by:
   - Recipient address
   - Message ID (from test output)
   - Timestamp
3. Check delivery status:
   - ✅ **Delivered** - Email successfully delivered
   - 📬 **Queued** - Email is being processed
   - ⚠️ **Bounced** - Recipient address issue
   - 🚫 **Blocked** - Spam filter blocked
   - ❌ **Failed** - Sending failed

### Via Resend API:

```bash
curl -X GET 'https://api.resend.com/emails/{email_id}' \
  -H 'Authorization: Bearer re_SDXQnpH5_EhXAJihxYgJRRgug7xjs6qcX'
```

---

## 🧪 Testing Checklist

Use this checklist to systematically test email delivery:

### Pre-Testing

- [ ] Verify Resend API key is set
- [ ] Confirm domain is verified in Resend
- [ ] Check DNS records (SPF, DKIM, DMARC)
- [ ] Prepare test email addresses for different providers

### During Testing

- [ ] Run quick test with Outlook address
- [ ] Run quick test with Yahoo address
- [ ] Run quick test with Hotmail address
- [ ] Check all email inboxes
- [ ] Check all spam/junk folders
- [ ] Note Message IDs from successful sends

### Post-Testing

- [ ] Verify emails arrived in inbox (not spam)
- [ ] Check Resend dashboard for delivery confirmation
- [ ] Review any error messages
- [ ] Document which providers work/don't work
- [ ] Check server logs for additional insights

### If Issues Found

- [ ] Review DNS configuration
- [ ] Check domain verification status
- [ ] Verify API key is correct
- [ ] Check rate limits
- [ ] Review Resend dashboard for bounces
- [ ] Test with different email addresses
- [ ] Check provider-specific spam filters

---

## 🔧 Environment Configuration

Ensure these environment variables are set:

```bash
# .env file
RESEND_API_KEY=re_SDXQnpH5_EhXAJihxYgJRRgug7xjs6qcX
FROM_EMAIL=no-reply@app.proliinkconnect.co.za
NODE_ENV=production  # or development
```

### Verifying Environment Variables

```bash
# Check if variables are set
echo $RESEND_API_KEY
echo $FROM_EMAIL

# Or in Node.js
node -e "console.log('API Key:', process.env.RESEND_API_KEY); console.log('From Email:', process.env.FROM_EMAIL);"
```

---

## 📝 Common Test Scenarios

### Scenario 1: Testing Signup Flow

```bash
# Run the application
npm run dev

# In another terminal, test signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@outlook.com",
    "password": "TestPassword123!",
    "role": "CLIENT"
  }'
```

Expected: Email should be sent to test@outlook.com

### Scenario 2: Testing Resend Verification

```bash
curl -X POST http://localhost:3000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "test@outlook.com"}'
```

Expected: Verification email should be resent

### Scenario 3: Direct Resend API Test

```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer re_SDXQnpH5_EhXAJihxYgJRRgug7xjs6qcX" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "no-reply@app.proliinkconnect.co.za",
    "to": "test@outlook.com",
    "subject": "Test Email",
    "html": "<h1>Test</h1><p>This is a test email.</p>"
  }'
```

Expected: Success response with message ID

---

## 📞 Support Resources

### Resend Resources

- **Dashboard:** https://resend.com
- **API Documentation:** https://resend.com/docs
- **Domain Verification:** https://resend.com/domains
- **Email Logs:** https://resend.com/emails
- **Status Page:** https://status.resend.com
- **Support:** support@resend.com

### DNS Testing Tools

- **MXToolbox:** https://mxtoolbox.com
- **Google DNS Checker:** https://dns.google
- **DNS Propagation Checker:** https://dnschecker.org

### Email Deliverability Tools

- **Mail Tester:** https://www.mail-tester.com
- **GlockApps:** https://glockapps.com
- **Microsoft SNDS:** https://postmaster.live.com/snds

---

## 🎯 Expected Results

### Successful Email Delivery

When everything is working correctly, you should see:

1. **Console Output:**
   ```
   ✅ Email sent successfully
   📧 Message ID: abc123...
   📬 Check your inbox: test@outlook.com
   ```

2. **Email in Inbox:**
   - Subject: "Verify Your Email - Proliink Connect"
   - From: no-reply@app.proliinkconnect.co.za
   - Contains verification link
   - Arrived within 1-2 minutes

3. **Resend Dashboard:**
   - Status: "Delivered"
   - No bounce or complaint reports
   - Delivery time < 5 seconds

### Failed Email Delivery

If emails are failing, you'll see:

1. **Console Output:**
   ```
   ❌ Email sending failed
   Error: [specific error message]
   ```

2. **Audit Logs:**
   ```sql
   SELECT * FROM "AuditLog" 
   WHERE action = 'EMAIL_SEND_FAILED'
   ORDER BY "createdAt" DESC LIMIT 10;
   ```

3. **Resend Dashboard:**
   - Status: "Failed" or "Bounced"
   - Error message explaining why

---

## 🚀 Quick Start Commands

```bash
# 1. Quick test with Outlook
node scripts/test-email-quick.js your-email@outlook.com

# 2. Quick test with Yahoo
node scripts/test-email-quick.js your-email@yahoo.com

# 3. Comprehensive test (after editing script)
node scripts/test-email-non-gmail-delivery.js

# 4. Check Resend configuration
node -e "console.log('API Key:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Not set'); console.log('From Email:', process.env.FROM_EMAIL || 'no-reply@app.proliinkconnect.co.za');"

# 5. Test signup flow
npm run dev  # In one terminal
# Then in another terminal:
curl -X POST http://localhost:3000/api/auth/signup -H "Content-Type: application/json" -d '{"name":"Test","email":"test@outlook.com","password":"Test123!","role":"CLIENT"}'
```

---

## ✅ Success Criteria

Email delivery is working correctly when:

1. ✅ Emails arrive in inbox (not spam) within 2 minutes
2. ✅ All email providers tested (Gmail, Outlook, Yahoo) receive emails
3. ✅ Verification links in emails are clickable and valid
4. ✅ Resend dashboard shows "Delivered" status
5. ✅ No errors in server logs
6. ✅ Audit logs show successful email sends
7. ✅ Both signup and resend verification work

---

## 📝 Notes

- **First-time senders:** Emails may go to spam initially until sender reputation builds
- **DNS propagation:** Can take up to 24-48 hours for full propagation
- **Rate limits:** Free Resend plan has limits; check your plan
- **Domain reputation:** New domains need time to build trust
- **Test thoroughly:** Test with multiple providers and email addresses

---

**Last Updated:** {{current_date}}  
**For Issues:** Check EMAIL_DELIVERY_FIX_SUMMARY.md for detailed troubleshooting

