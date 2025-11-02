# Production Environment Variables

## Production URL Configuration

Based on your domain setup, here are the production environment variable values:

### Development (Local)
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
```

### Production
```bash
NEXT_PUBLIC_APP_URL=https://app.proliinkconnect.co.za
NEXTAUTH_URL=https://app.proliinkconnect.co.za
```

## Complete Production Environment Variables

Set these in your Vercel project settings (Settings → Environment Variables):

```bash
# Application URL (Public - accessible in browser)
NEXT_PUBLIC_APP_URL=https://app.proliinkconnect.co.za

# Authentication URL
NEXTAUTH_URL=https://app.proliinkconnect.co.za
NEXTAUTH_SECRET=your-nextauth-secret-here

# Database
DATABASE_URL=your-production-database-url
DIRECT_URL=your-production-direct-url
PRISMA_DISABLE_PREPARED_STATEMENTS=true

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-here
JWT_EXPIRES_IN=7d

# Email Service (Resend)
RESEND_API_KEY=re_ZTeSkpCV_8haEEpLg4Z1vGtT3jSj74HoUn
FROM_EMAIL=no-reply@app.proliinkconnect.co.za

# Payment Service (Paystack)
PAYSTACK_SECRET_KEY=sk_live_your-production-secret-key
PAYSTACK_PUBLIC_KEY=pk_live_your-production-public-key
PAYSTACK_TEST_MODE=false
PAYSTACK_WEBHOOK_URL=https://app.proliinkconnect.co.za/api/webhooks/paystack

# App Configuration
NODE_ENV=production
COOKIE_DOMAIN=app.proliinkconnect.co.za
LOG_LEVEL=info
```

## Important Notes

### NEXT_PUBLIC_APP_URL vs NEXTAUTH_URL

- **`NEXT_PUBLIC_APP_URL`**: 
  - Used for client-side code (accessible in browser)
  - Must start with `https://` in production
  - Used for API calls, redirects, and frontend URL references

- **`NEXTAUTH_URL`**: 
  - Used by NextAuth.js for callbacks and OAuth redirects
  - Must match your actual domain
  - Should match `NEXT_PUBLIC_APP_URL` in most cases

### Security

⚠️ **Important**: Never commit production environment variables to git. Set them in:
- Vercel Dashboard (for Vercel deployments)
- Your hosting platform's environment variable settings
- CI/CD pipeline secrets

## Verification Checklist

Before deploying to production:

- [ ] `NEXT_PUBLIC_APP_URL` is set to `https://app.proliinkconnect.co.za`
- [ ] `NEXTAUTH_URL` is set to `https://app.proliinkconnect.co.za`
- [ ] All URLs use `https://` (not `http://`)
- [ ] `COOKIE_DOMAIN` is set to `app.proliinkconnect.co.za`
- [ ] `FROM_EMAIL` uses the verified domain: `no-reply@app.proliinkconnect.co.za`
- [ ] `PAYSTACK_WEBHOOK_URL` points to production domain
- [ ] All production API keys are set (not test keys)

---

**Domain**: `app.proliinkconnect.co.za`  
**Production URL**: `https://app.proliinkconnect.co.za`

