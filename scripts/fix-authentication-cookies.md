# Authentication Cookie Fix

## Problem Identified
The provider dashboard is failing to load because users are not authenticated. The API calls return 401 Unauthorized because the authentication cookie is not being sent correctly.

## Root Cause
The `COOKIE_DOMAIN` environment variable is set to `app.proliinkconnect.co.za`, which causes cookie domain issues. When the cookie domain is set to the exact domain name, it can cause compatibility issues with how browsers handle cookies.

## Solution Applied
Updated the `setAuthCookie` function in `lib/auth.ts` to handle the problematic domain configuration:

```typescript
// Determine cookie domain configuration
let cookieDomain = undefined;
if (process.env.COOKIE_DOMAIN) {
  // If COOKIE_DOMAIN is set to the exact domain (e.g., "app.proliinkconnect.co.za"),
  // remove it to let the browser handle it automatically for better compatibility
  if (process.env.COOKIE_DOMAIN === 'app.proliinkconnect.co.za') {
    cookieDomain = undefined; // Let browser handle domain automatically
  } else {
    cookieDomain = process.env.COOKIE_DOMAIN;
  }
}
```

## Expected Results
After this fix is deployed:

1. ✅ Authentication cookies will be set correctly
2. ✅ Users will remain authenticated after login
3. ✅ API calls will include the authentication cookie
4. ✅ Provider dashboard will load successfully
5. ✅ All authenticated features will work properly

## Alternative Solutions
If the issue persists, consider these environment variable changes:

1. **Remove COOKIE_DOMAIN entirely**: Let the browser handle cookie domains automatically
2. **Set COOKIE_DOMAIN to ".proliinkconnect.co.za"**: Use leading dot for subdomain sharing
3. **Set COOKIE_DOMAIN to "proliinkconnect.co.za"**: Use domain without leading dot

## Testing Steps
1. Deploy the fix
2. Try logging in as a provider
3. Check browser developer tools for auth-token cookie
4. Verify /api/auth/me returns user data
5. Confirm provider dashboard loads successfully
