# 🔑 Paystack Keys Quick Reference

## 🎯 At a Glance

| Environment | Secret Key | Public Key | TEST_MODE | Where to Set |
|------------|-----------|------------|-----------|--------------|
| **Development** | `sk_test_...` | `pk_test_...` | `true` | `.env.local` |
| **Production** | `sk_live_...` | `pk_live_...` | `false` | Vercel Dashboard |

---

## ✅ Quick Setup

### Development (Local)
```bash
# .env.local
PAYSTACK_SECRET_KEY=sk_test_your_test_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_test_public_key
PAYSTACK_TEST_MODE=true
PAYSTACK_WEBHOOK_URL=http://localhost:3000/api/webhooks/paystack
```

### Production (Vercel)
```bash
# Vercel Dashboard → Settings → Environment Variables → Production
PAYSTACK_SECRET_KEY=sk_live_your_live_secret_key
PAYSTACK_PUBLIC_KEY=pk_live_your_live_public_key
PAYSTACK_TEST_MODE=false
PAYSTACK_WEBHOOK_URL=https://app.proliinkconnect.co.za/api/webhooks/paystack
```

---

## 🔍 Verify Configuration

```bash
# Health check endpoint
curl https://yourdomain.com/api/health/paystack

# Expected response (healthy):
{
  "status": "healthy",
  "configuration": {
    "secretKeyType": "live",  # or "test" for dev
    "publicKeyType": "live",  # or "test" for dev
    "keysMatch": true,
    "testModeFlag": false     # or true for dev
  }
}
```

---

## ⚠️ Common Mistakes

| ❌ Wrong | ✅ Correct |
|---------|-----------|
| `sk_test_...` + `pk_live_...` | Both `sk_test_...` + `pk_test_...` |
| `sk_live_...` in development | `sk_test_...` in development |
| `PAYSTACK_TEST_MODE=true` with live keys | `PAYSTACK_TEST_MODE=false` with live keys |
| Live keys in `.env` file | Live keys only in Vercel |

---

## 🚨 Validation Rules

The system automatically validates:

1. ✅ **Key Consistency**: Secret and public keys must match (both test or both live)
2. ✅ **Environment Alignment**: Production should use live keys, dev should use test keys
3. ✅ **Mode Flag**: `PAYSTACK_TEST_MODE` must match key type
4. ✅ **Format**: Keys must start with correct prefix (`sk_test_`, `sk_live_`, etc.)

---

## 📞 Need Help?

- **Full Setup Guide**: See [PAYSTACK_LIVE_KEYS_SETUP.md](./PAYSTACK_LIVE_KEYS_SETUP.md)
- **Production Variables**: See [PRODUCTION_ENV_VARIABLES.md](./PRODUCTION_ENV_VARIABLES.md)
- **Health Check**: `/api/health/paystack`

---

**Remember**: Never commit live keys to git! 🚫
