# User Flow

> Complete user journey from discovery to delivery

## Overview

This document describes the end-to-end user flow for creating and ordering a personalized children's book.

---

## Flow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Landing    │────▶│  Create     │────▶│  Generate   │
│  Page       │     │  Book Form  │     │  Book (AI)  │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Order      │◀────│  Preview    │◀────│  Register   │
│  Checkout   │     │  Book       │     │  (if new)   │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Payment    │────▶│  Print &    │────▶│  Delivery   │
│  (Stripe)   │     │  Ship       │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## 1. Discovery (Landing Page)

**Route:** `/`

**User Actions:**
- Views hero section and value proposition
- Sees sample books and testimonials
- Clicks "Create Free Book" CTA

**Technical:**
- Server-rendered landing page
- No authentication required

---

## 2. Book Creation Form

**Route:** `/create`

**User Actions:**
- Enters child's name and age
- Selects book type (board, picture, story)
- Chooses theme (adventure, bedtime, fantasy, etc.)
- Optionally uploads child's photo
- Optionally describes custom story

**Technical:**
- Form validation with Zod
- Photo upload to Supabase Storage
- Character extraction via Gemini (optional)

---

## 3. AI Book Generation

**Route:** `/create/generating`

**User Actions:**
- Watches progress animation
- Waits 2-5 minutes for generation

**Technical:**
- `POST /api/ai/generate-book`
- Gemini 3 Pro generates story
- Gemini generates illustrations (10 pages)
- Images uploaded to Supabase Storage
- Book saved to database

---

## 4. Registration Gate

**Trigger:** After book generation (if not logged in)

**User Actions:**
- Creates account (email/password or Google)
- Verifies email (optional)

**Technical:**
- `AuthModal` component
- Supabase Auth
- Book linked to new user account

---

## 5. Book Preview

**Route:** `/book/[bookId]`

**User Actions:**
- Views interactive book with page-flip
- Reads through story
- Downloads PDF preview
- Clicks "Order Print"

**Technical:**
- `StoryBookViewer` component
- `react-pageflip` for animations
- PDF generation with jsPDF

---

## 6. Order Configuration

**Route:** `/create/[bookId]/order`

**User Actions:**
- Selects format (softcover/hardcover)
- Selects size (6x6, 8x8, 8x10)
- Enters quantity
- Enters shipping address
- Reviews pricing

**Technical:**
- Price calculation (`lib/stripe/server.ts`)
- Form validation
- Address autocomplete (optional)

---

## 7. Payment (Stripe Checkout)

**Route:** Stripe hosted checkout

**User Actions:**
- Enters payment details
- Completes purchase

**Technical:**
- `POST /api/checkout` creates session
- Redirect to Stripe Checkout
- Webhook receives `checkout.session.completed`

---

## 8. Order Confirmation

**Route:** `/order/success`

**User Actions:**
- Views order confirmation
- Receives confirmation email

**Technical:**
- Order status updated to `paid`
- Email sent via Resend/SendGrid
- Order visible in `/orders`

---

## 9. Print & Fulfillment

**Backend Process:**

1. Generate print-ready PDF
2. Upload to Lulu API
3. Create print job
4. Monitor status
5. Update tracking number

---

## 10. Delivery & Follow-up

**User Actions:**
- Tracks shipment
- Receives book (5-10 days)
- Receives follow-up email

**Technical:**
- Tracking number from Lulu
- Status updates via webhook
- Follow-up email automation

---

## Key Routes Summary

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/` | Landing page | No |
| `/create` | Book creation form | No |
| `/create/generating` | Generation progress | No |
| `/book/[bookId]` | Book preview | Yes |
| `/create/[bookId]/order` | Order configuration | Yes |
| `/order/success` | Order confirmation | Yes |
| `/orders` | Order history | Yes |
| `/admin` | Admin dashboard | Admin only |

---

## Conversion Funnel

| Stage | Target Rate |
|-------|-------------|
| Visitor → Start Creation | 15-25% |
| Start → Complete Generation | 60-70% |
| Complete → Register | 25-35% |
| Register → Order Print | 20-30% |
| Order → Subscribe | 10-15% |

---

## Files

| File | Purpose |
|------|---------|
| `app/page.tsx` | Landing page |
| `app/create/` | Creation flow pages |
| `app/book/[bookId]/` | Book viewer page |
| `app/order/` | Order pages |
| `app/orders/` | Order history |
