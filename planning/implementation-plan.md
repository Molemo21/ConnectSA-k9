# 🚀 Implementation Plan & User Flows

_Last reviewed: 2024-07-21_

## 1. User Flows

### Client Flow
- [x] **Landing & Booking**: `/app/page.tsx`, `/app/book-service/page.tsx` exist. Extend `/book-service` to support new booking fields and logic.
- [x] **Authentication**: `/app/login/`, `/app/signup/` exist and are functional.
- [ ] **Provider Matching**: To implement auto-assignment logic in backend and update dashboard UI.
- [x] **Escrow Payment**: Payment model exists (`Payment`), but escrow logic and Paystack integration to be added.
- [x] **Job Execution**: Messaging/calling and live location to be added (new models, APIs, and UI components).
- [ ] **Completion & Proof**: Extend booking flow to require/upload photo proof from both parties.
- [ ] **Payment Release & Review**: Add escrow release logic and review UI.
- [ ] **Cancellation**: Add cancellation/refund logic to backend and UI.
- [ ] **Dispute Resolution**: Add admin dispute review UI and backend logic.

### Provider Flow
- [x] **Onboarding & Availability**: `/app/provider/onboarding/page.tsx` exists. Add `available` toggle to provider profile and backend.
- [x] **Job Assignment**: Extend backend for auto-assignment and provider accept/decline endpoints.
- [x] **Job Execution**: Messaging/calling and live location to be added.
- [ ] **Completion & Proof**: Extend provider dashboard for photo proof upload and completion confirmation.
- [ ] **Payment & Review**: Add payout logic and review display.

### Admin Flow
- [x] **Dashboard**: `/app/admin/dashboard/page.tsx` exists. Extend for new stats and dispute management.
- [x] **Provider Management**: `/app/admin/` and related API exist. Extend for onboarding and status management.
- [ ] **Dispute Resolution**: Add UI and backend for evidence review and payment override.
- [x] **System Management**: Categories/services management exists or can be extended in admin area.

### System Flow
- [ ] **Provider Matching**: To implement auto-assignment logic in backend.
- [ ] **Escrow & Payments**: Integrate Paystack, add escrow logic, handle refunds/cancellation fees.
- [ ] **Notifications**: Add Notification model, in-app/email/SMS logic, and UI.
- [ ] **Messaging & Location**: Add Message model, chat APIs, and live location logic.
- [ ] **Dispute Handling**: Add flagging and admin notification logic.

---

## 2. Technical Implementation Plan (with Codebase Alignment)

### Database & Models
- [x] `Booking` (job) — exists
- [ ] `Proposal` (provider offers/acceptance) — **to add**
- [x] `Payment` (escrow logic, Paystack integration) — exists, **to extend**
- [ ] `Message` (in-app chat) — **to add**
- [ ] `Notification` (in-app/email/SMS) — **to add**
- [ ] `Provider.available` (availability toggle) — **to add**

### API Endpoints
- [x] Booking: `/app/api/book-service/` exists, **to extend**
- [ ] Proposal: **to add**
- [ ] Payment: **to extend** for escrow, release, refund
- [ ] Messaging: **to add**
- [ ] Notification: **to add**
- [ ] Provider: **to extend** for availability
- [x] Admin: `/app/api/admin/` exists, **to extend** for disputes

### Frontend Pages & Components
- [x] Client: `/app/page.tsx`, `/app/book-service/page.tsx`, `/app/dashboard/` — **to extend**
- [x] Provider: `/app/provider/onboarding/page.tsx`, `/app/provider/pending/page.tsx` — **to extend**
- [x] Admin: `/app/admin/dashboard/page.tsx` — **to extend**
- [x] Shared UI: `/components/ui/` — **to extend** with chat, notification, location, proof upload

### Integrations
- [ ] Payments: **Integrate Paystack** for escrow, payout, refund
- [ ] Messaging: **Add Supabase Realtime or similar**
- [ ] Notifications: **Add in-app, email, SMS**
- [ ] Live Location: **Add browser geolocation + realtime**

### Business Logic & Automation
- [ ] Provider matching, escrow logic, cancellation/refund, dispute handling, review gating — **to implement**

### Security & Best Practices
- [x] Auth guards, input validation, secure file uploads, audit trails — **review and extend as needed**

### Rollout Plan
1. [x] Database schema updates (Proposal, Message, Notification, Provider.available)
2. [x] Booking & provider matching logic
3. [x] Payment integration (Paystack)
4. [x] Job execution & completion flow
5. [x] UI/UX improvements (real data, loading states, empty states, real-time stats)
6. [x] Comprehensive UI/UX redesign (modern design system, consistent branding, improved layouts)
7. [ ] Messaging & notifications
8. [ ] Job completion & disputes
9. [ ] Frontend polish
10. [ ] Testing & QA
11. [ ] Go live

---

**Legend:**
- [x] Exists (may need extension)
- [ ] To add/implement

**This file is a living document. Update as features are added, flows change, or new best practices are adopted.** 