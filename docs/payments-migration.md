# Payments Migration

## Overview
This document outlines the migration from the old `paystack` package to the new `paystack-sdk` package. The migration involves updating the payment initialization and verification logic to use the new SDK.

## Changes Made

### Old Usage
Previously, the payment logic was implemented using a custom `PaystackClient` class that manually handled API requests to Paystack.

```typescript
// Initialize payment
const paystackResponse = await paystackClient.initializePayment({
  amount: breakdown.totalAmount,
  email: user.email,
  reference: reference,
  callback_url: validated.callbackUrl,
  metadata: {
    bookingId: booking.id,
    clientId: user.id,
    providerId: booking.providerId,
    serviceId: booking.serviceId,
    serviceName: booking.service?.name,
  },
});

// Verify payment
const paystackVerification = await paystackClient.verifyPayment(reference);
```

### New Usage
With the `paystack-sdk`, the payment logic is simplified and more robust.

```typescript
import Paystack from 'paystack-sdk';

// Initialize Paystack SDK
const paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY);

// Initialize payment
const paystackResponse = await paystack.transaction.initialize({
  amount: breakdown.totalAmount * 100, // Convert to kobo
  email: user.email,
  reference: reference,
  callback_url: validated.callbackUrl,
  metadata: {
    bookingId: booking.id,
    clientId: user.id,
    providerId: booking.providerId,
    serviceId: booking.serviceId,
    serviceName: booking.service?.name,
  },
  currency: 'ZAR',
});

// Verify payment
const paystackVerification = await paystack.transaction.verify(reference);
```

## Testing
Ensure to test the payment flow end-to-end to verify that the integration with Paystack's API works as expected.

## Conclusion
The migration to `paystack-sdk` provides a more streamlined and reliable way to handle payments with Paystack. This document should serve as a guide for understanding the changes and ensuring a smooth transition.
