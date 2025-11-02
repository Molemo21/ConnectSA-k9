type BookingEmailData = {
  bookingId: string
  serviceName?: string
  providerName?: string
  clientName?: string
  amount?: number
  when?: string
  linkUrl: string
}

const base = (title: string, body: string, cta?: { label: string; url: string }) => `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>${title}</title>
    <style>
      body { background:#f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif; margin:0; padding:24px; }
      .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
      .title { font-size: 18px; font-weight: 700; color:#111827; margin: 0 0 8px; }
      .body { font-size: 14px; color:#374151; line-height: 1.6; }
      .cta { display:inline-block; margin-top:16px; background:#111827; color:#fff; text-decoration:none; padding:10px 16px; border-radius:8px; font-weight:600; }
      .footer { margin-top:24px; color:#6b7280; font-size:12px; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="title">${title}</div>
      <div class="body">${body}</div>
      ${cta ? `<a class="cta" href="${cta.url}">${cta.label}</a>` : ''}
      <div class="footer">You’re receiving this because of activity on your ConnectSA booking.</div>
    </div>
  </body>
</html>`

export const EmailTemplates = {
  bookingCreated: (d: BookingEmailData) => base(
    'Booking Request Sent',
    `Your booking request for <strong>${d.serviceName || 'service'}</strong> has been sent. We’ll notify you when the provider responds.`,
    { label: 'View booking', url: d.linkUrl }
  ),
  bookingAccepted: (d: BookingEmailData) => base(
    'Booking Accepted – Proceed with Payment',
    `${d.providerName || 'The provider'} accepted your booking for <strong>${d.serviceName || 'service'}</strong>.`,
    { label: 'Proceed to payment', url: d.linkUrl }
  ),
  bookingDeclined: (d: BookingEmailData) => base(
    'Booking Declined',
    `Unfortunately, your booking for <strong>${d.serviceName || 'service'}</strong> was declined. You can try another provider.`,
    { label: 'Find another provider', url: d.linkUrl }
  ),
  paymentReceived: (d: BookingEmailData) => base(
    'Payment Received – You Can Start the Job',
    `Payment for booking <strong>#${d.bookingId}</strong> has been received. Amount: <strong>R${(d.amount || 0).toFixed(2)}</strong>.`,
    { label: 'Open booking', url: d.linkUrl }
  ),
  jobStarted: (d: BookingEmailData) => base(
    'Job Started',
    `${d.providerName || 'The provider'} has started your <strong>${d.serviceName || 'service'}</strong>.`,
    { label: 'Track progress', url: d.linkUrl }
  ),
  jobCompleted: (d: BookingEmailData) => base(
    'Job Completed – Please Review',
    `Your <strong>${d.serviceName || 'service'}</strong> has been marked complete. Please review and confirm to release payment.`,
    { label: 'Review and confirm', url: d.linkUrl }
  ),
  paymentReleased: (d: BookingEmailData) => base(
    'Payment Released',
    `Payment for booking <strong>#${d.bookingId}</strong> has been released. Funds typically arrive within 1–3 business days.`,
    { label: 'View payout', url: d.linkUrl }
  )
}





