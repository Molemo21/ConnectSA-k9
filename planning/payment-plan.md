Implement a Paystack-based escrow payment system for our service marketplace with the following workflow:

Step 1 – Client Books & Pays

When a client books a service, call the Paystack API to create a payment session.

On success, capture the payment into our platform’s merchant account.

Save the booking with status "pending_execution" in the database.

Store the Paystack reference and transaction details in a payments table.

Step 2 – Funds Held in Escrow

Funds remain in the merchant account until explicitly released.

Link the payment record to the specific booking in the database.

Add a payment_status field to track "escrow", "released", "refunded".

Step 3 – Job Completion Proof

Allow provider to upload proof (photos, notes) to /bookings/:id/complete.

Once proof is submitted, notify client to confirm completion.

If the client does not respond within X days, auto-confirm the job.

Step 4 – Release Funds

On completion approval, call Paystack Transfer API to pay the provider.

Store payout transaction details in the database.

Update booking status to "completed" and payment status to "released".

Step 5 – Dispute Handling

If a dispute is raised before payment release, keep funds in escrow.

Provide an admin interface to resolve disputes and decide payout.

Admin can either trigger a provider payout or initiate a client refund via Paystack Refund API.

Technical Requirements:

Use environment variables for Paystack secret/public keys.

Implement secure webhook handlers for payment.success, transfer.success, and refund.success.

Ensure idempotency to avoid double payments.

Add proper error handling and logging for all payment operations.

All database changes must be within transactions to maintain consistency.

Deliverables:

API routes:

POST /bookings/:id/pay → Initiates Paystack payment.

POST /bookings/:id/complete → Uploads proof & requests completion.

POST /bookings/:id/release-payment → Releases funds to provider.

POST /bookings/:id/dispute → Opens a dispute.

Database migrations for payments and payouts tables.

Webhook endpoint /webhooks/paystack for event handling.

Integration tests for payment, escrow, release, refund, and dispute flows.