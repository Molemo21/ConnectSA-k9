# 🚀 **Resend DNS Setup Guide for app.proliinkconnect.co.za**

## **📋 Overview**

This guide provides step-by-step instructions for setting up DNS records for the domain `app.proliinkconnect.co.za` to enable email sending through Resend.

---

## **🔧 Step 1: Domain Verification in Resend**

### **1.1 Login to Resend Dashboard**
1. Go to [https://resend.com](https://resend.com)
2. Sign in to your account
3. Navigate to **"Domains"** section in the sidebar

### **1.2 Add Your Domain**
1. Click **"Add Domain"** button
2. Enter: `app.proliinkconnect.co.za`
3. Click **"Add Domain"**

### **1.3 Get DNS Records**
After adding the domain, Resend will provide you with the required DNS records. You'll see something like:

```
Type: TXT
Name: @
Value: resend-verification=abc123def456...

Type: CNAME
Name: resend
Value: track.resend.com
```

---

## **🔧 Step 2: Configure DNS Records**

### **2.1 Access Your DNS Management**
Log in to your domain registrar or DNS provider (e.g., Cloudflare, GoDaddy, Namecheap, etc.)

### **2.2 Add Required DNS Records**

#### **A. Domain Verification Record**
```
Type: TXT
Name: @ (or leave blank for root domain)
Value: resend-verification=your_verification_code_here
TTL: 300 (5 minutes) or default
```

#### **B. Email Tracking Record**
```
Type: CNAME
Name: resend
Value: track.resend.com
TTL: 300 (5 minutes) or default
```

#### **C. SPF Record (Recommended)**
```
Type: TXT
Name: @ (or leave blank for root domain)
Value: v=spf1 include:_spf.resend.com ~all
TTL: 300 (5 minutes) or default
```

#### **D. DKIM Record (Optional but Recommended)**
Resend will provide a DKIM record after domain verification. It will look like:
```
Type: CNAME
Name: resend._domainkey
Value: resend._domainkey.resend.com
TTL: 300 (5 minutes) or default
```

#### **E. DMARC Record (Optional but Recommended)**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@proliinkconnect.co.za
TTL: 300 (5 minutes) or default
```

---

## **🔧 Step 3: Wait for Verification**

### **3.1 DNS Propagation**
- DNS changes can take **5-60 minutes** to propagate
- Some DNS providers may take up to **24 hours**
- Use tools like [whatsmydns.net](https://www.whatsmydns.net) to check propagation

### **3.2 Verify in Resend Dashboard**
1. Go back to your Resend dashboard
2. Check the domain status
3. Status should change from "Pending" to "Verified" ✅

---

## **🔧 Step 4: Environment Variables Setup**

### **4.1 Development (.env.local)**
```bash
# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=no-reply@app.proliinkconnect.co.za

# App Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### **4.2 Production (Vercel Environment Variables)**
```bash
# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=no-reply@app.proliinkconnect.co.za

# App Configuration
NEXTAUTH_SECRET=your_production_nextauth_secret
NEXTAUTH_URL=https://app.proliinkconnect.co.za
```

---

## **🔧 Step 5: Vercel Environment Variables**

### **5.1 Add to Vercel Dashboard**
1. Go to your Vercel project dashboard
2. Navigate to **"Settings"** → **"Environment Variables"**
3. Add the following variables:

```
RESEND_API_KEY = your_resend_api_key_here
FROM_EMAIL = no-reply@app.proliinkconnect.co.za
```

### **5.2 Redeploy Application**
1. Trigger a new deployment to apply changes
2. Or push a new commit to trigger automatic deployment

---

## **🧪 Step 6: Testing Your Setup**

### **6.1 Test Email Sending**
1. **Development Testing:**
   ```bash
   npm run dev
   # Emails will be logged to console
   ```

2. **Production Testing:**
   - Visit your app: `https://app.proliinkconnect.co.za`
   - Test signup/verification flow
   - Check Resend dashboard for sent emails

### **6.2 Test API Route**
```bash
curl -X POST https://app.proliinkconnect.co.za/api/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "subject": "Test Email",
    "message": "This is a test email from Proliink Connect"
  }'
```

---

## **🔍 Troubleshooting**

### **Common Issues & Solutions**

#### **1. "Domain not verified" Error**
**Symptoms:** Emails fail to send with domain verification error
**Solutions:**
- Check DNS records are correctly configured
- Wait for DNS propagation (up to 24 hours)
- Verify domain in Resend dashboard
- Ensure TTL is set to a low value (300 seconds) for faster propagation

#### **2. "Invalid API key" Error**
**Symptoms:** Authentication errors when sending emails
**Solutions:**
- Verify API key is correct in environment variables
- Check environment variables are set in both development and production
- Restart application after adding variables
- Ensure API key has proper permissions

#### **3. "From address not authorized" Error**
**Symptoms:** Emails fail with sender authorization error
**Solutions:**
- Ensure domain is verified in Resend
- Use correct from email format: `no-reply@app.proliinkconnect.co.za`
- Check FROM_EMAIL environment variable
- Verify DNS records are properly configured

#### **4. Emails not sending in production**
**Symptoms:** Emails work in development but not in production
**Solutions:**
- Verify NODE_ENV=production
- Check Vercel environment variables are set
- Review Resend dashboard for errors
- Check application logs in Vercel dashboard

#### **5. DNS Records Not Propagating**
**Symptoms:** Domain verification fails or takes too long
**Solutions:**
- Use DNS propagation checker tools
- Contact your DNS provider for support
- Try using different DNS servers (8.8.8.8, 1.1.1.1)
- Wait up to 24 hours for full propagation

---

## **📊 Monitoring & Analytics**

### **Resend Dashboard Features**
- 📈 **Email Analytics**: Open rates, click rates, delivery rates
- 📧 **Email Logs**: All sent emails with status and timestamps
- 🚨 **Bounce Management**: Handle failed deliveries and spam complaints
- 📊 **Domain Performance**: Delivery rates and reputation by domain

### **Key Metrics to Monitor**
- ✅ **Delivery Rate**: Should be >95%
- ✅ **Open Rate**: Industry average ~20%
- ✅ **Bounce Rate**: Should be <5%
- ✅ **Spam Complaints**: Should be <0.1%

---

## **🔒 Security Best Practices**

### **Email Security**
- ✅ **SPF Record**: Prevents email spoofing
- ✅ **DKIM**: Ensures email integrity and authenticity
- ✅ **DMARC**: Provides policy for handling authentication failures
- ✅ **Rate Limiting**: Built into Resend API to prevent abuse

### **API Security**
- ✅ **Environment Variables**: Never commit API keys to version control
- ✅ **Domain Verification**: Only send from verified domains
- ✅ **Error Handling**: Graceful fallbacks for email failures
- ✅ **Input Validation**: Validate email addresses and content

---

## **🚀 Next Steps**

### **Immediate Actions**
1. ✅ Add domain to Resend dashboard
2. ✅ Configure DNS records with your provider
3. ✅ Set environment variables in Vercel
4. ✅ Test email sending functionality
5. ✅ Monitor email delivery rates

### **Future Enhancements**
- 📧 **Email Templates**: Create more branded templates
- 📊 **Analytics**: Track email engagement and user behavior
- 🔄 **Automation**: Set up automated email workflows
- 📱 **Mobile Optimization**: Ensure emails look great on mobile devices
- 🌍 **Localization**: Add support for multiple languages

---

## **📞 Support Resources**

### **Resend Support**
- 📧 Email: support@resend.com
- 📚 Documentation: [https://resend.com/docs](https://resend.com/docs)
- 💬 Discord: [https://discord.gg/resend](https://discord.gg/resend)
- 🐦 Twitter: [@resend](https://twitter.com/resend)

### **DNS Provider Support**
- **Cloudflare**: [https://support.cloudflare.com](https://support.cloudflare.com)
- **GoDaddy**: [https://support.godaddy.com](https://support.godaddy.com)
- **Namecheap**: [https://support.namecheap.com](https://support.namecheap.com)

### **Vercel Support**
- 📚 Documentation: [https://vercel.com/docs](https://vercel.com/docs)
- 💬 Discord: [https://discord.gg/vercel](https://discord.gg/vercel)

---

## **📋 Checklist**

### **DNS Setup**
- [ ] Domain added to Resend dashboard
- [ ] TXT record for domain verification added
- [ ] CNAME record for email tracking added
- [ ] SPF record added (recommended)
- [ ] DKIM record added (optional)
- [ ] DMARC record added (optional)
- [ ] Domain verified in Resend dashboard

### **Environment Setup**
- [ ] RESEND_API_KEY set in .env.local
- [ ] FROM_EMAIL set in .env.local
- [ ] Environment variables added to Vercel
- [ ] Application redeployed

### **Testing**
- [ ] Development email testing completed
- [ ] Production email testing completed
- [ ] Test API route working
- [ ] Email delivery confirmed
- [ ] Monitoring setup in place

---

**🎉 Your Resend integration with app.proliinkconnect.co.za is now ready for production use!**
