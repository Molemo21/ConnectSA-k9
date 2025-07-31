# 🏗️ ProLiink Architecture Summary

## 🧩 Major Modules
- Client flow
- Provider flow
- Messaging
- Escrow
- Admin dashboard

## 🗂️ Folder Structure
- `/pages/client` → all client-facing UIs
- `/pages/provider` → all provider views
- `/components` → shared UI elements
- `/lib` → backend logic (escrow, notifications, etc.)

## 🧪 State Management
- React Context + Supabase Realtime
- Notifications via webhooks

## 🧰 Tech Stack
- Next.js
- Tailwind CSS
- Supabase (or Firebase)
- Stripe (for escrow/payment)
