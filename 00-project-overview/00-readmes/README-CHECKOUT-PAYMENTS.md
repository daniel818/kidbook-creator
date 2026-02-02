# Checkout & Payments

> Stripe integration for book orders

## Overview

KidBook Creator uses Stripe for payment processing. The checkout flow creates a Stripe Checkout Session, handles payment via webhook, and updates order status.

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Frontend   │────▶│  /api/       │────▶│  Stripe     │
│  Checkout   │     │  checkout    │     │  Checkout   │
└─────────────┘     └──────────────┘     └─────────────┘
                                                │
                                                ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Order      │◀────│  /api/       │◀────│  Stripe     │
│  Updated    │     │  webhook     │     │  Webhook    │
└─────────────┘     └──────────────┘     └─────────────┘
```

---

## Checkout Flow

### 1. Create Checkout Session

**POST `/api/checkout`**

**Request Body:**
```typescript
{
  bookId: string;
  format: 'softcover' | 'hardcover';
  size: '7.5x7.5' | '8x8' | '8x10';
  quantity: number;
  shipping: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  }
}
```

**Response:**
```typescript
{
  sessionId: string;      // Stripe session ID
  url: string;            // Redirect URL
  orderId: string;        // Database order ID
  pricing: {
    subtotal: string;     // "$24.99"
    shipping: string;     // "$4.99"
    total: string;        // "$29.98"
  }
}
```

### 2. Redirect to Stripe

Frontend redirects user to `session.url` for payment.

### 3. Webhook Processing

Stripe sends `checkout.session.completed` event to `/api/webhook/stripe`.

### 4. Order Confirmation

- Order status updated to `paid`
- Book status updated to `ordered`
- Confirmation email sent

---

## Pricing (`lib/stripe/server.ts`)

### Base Prices (in cents)

| Format | 7.5x7.5 | 8x8 | 8x10 |
|--------|-----|-----|------|
| Softcover | $8.99 | $12.99 | $14.99 |
| Hardcover | $18.99 | $24.99 | $29.99 |

### Per-Page Pricing (in cents)

| Format | 7.5x7.5 | 8x8 | 8x10 |
|--------|-----|-----|------|
| Softcover | $0.35 | $0.45 | $0.55 |
| Hardcover | $0.45 | $0.55 | $0.65 |

### Shipping

- Standard shipping: $4.99

### Price Calculation

```typescript
function calculatePrice(options: BookPricing): PriceBreakdown {
  const pricing = PRICING[options.format][options.size];
  const basePrice = pricing.basePrice;
  const pagePrice = options.pageCount * pricing.perPage;
  const subtotal = (basePrice + pagePrice) * options.quantity;
  const shipping = SHIPPING_COST;
  const total = subtotal + shipping;

  return { basePrice, pagePrice, subtotal, shipping, total };
}
```

---

## Stripe Webhook (`app/api/webhook/stripe/route.ts`)

### Handled Events

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Update order to `paid`, send email |
| `payment_intent.succeeded` | Log success |
| `payment_intent.payment_failed` | Cancel order |

### Webhook Verification

```typescript
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET!
);
```

### Checkout Complete Handler

```typescript
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  // 1. Update order status to 'paid'
  await supabaseAdmin.from('orders').update({
    status: 'paid',
    stripe_payment_intent_id: session.payment_intent
  }).eq('stripe_checkout_session_id', session.id);

  // 2. Update book status to 'ordered'
  await supabaseAdmin.from('books').update({
    status: 'ordered'
  }).eq('id', metadata.bookId);

  // 3. Send confirmation email
  await sendOrderConfirmation(emailData);
}
```

---

## Orders API

### GET `/api/orders`

List all orders for authenticated user.

**Response:**
```typescript
Array<{
  id: string;
  bookId: string;
  bookTitle: string;
  childName: string;
  format: string;
  size: string;
  quantity: number;
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  trackingNumber?: string;
  luluOrderId?: string;
  shippingAddress: ShippingAddress;
  createdAt: string;
  updatedAt: string;
}>
```

### GET `/api/orders/session`

Get order by Stripe session ID (for success page).

---

## Order Status Flow

```
pending → paid → processing → printed → shipped → delivered
                     ↓
                 cancelled
```

| Status | Description |
|--------|-------------|
| `pending` | Checkout created, awaiting payment |
| `paid` | Payment received |
| `processing` | PDF generated, sent to printer |
| `printed` | Book printed |
| `shipped` | Book shipped, tracking available |
| `delivered` | Book delivered |
| `cancelled` | Order cancelled |

---

## Database Schema

### orders table

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  book_id UUID REFERENCES books(id),
  user_id UUID REFERENCES auth.users(id),
  
  -- Order details
  format TEXT NOT NULL,
  size TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  
  -- Pricing
  subtotal DECIMAL(10,2),
  shipping_cost DECIMAL(10,2),
  total DECIMAL(10,2),
  
  -- Shipping address
  shipping_full_name TEXT,
  shipping_address_line1 TEXT,
  shipping_address_line2 TEXT,
  shipping_city TEXT,
  shipping_state TEXT,
  shipping_postal_code TEXT,
  shipping_country TEXT,
  shipping_phone TEXT,
  
  -- Status & external IDs
  status TEXT DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  lulu_order_id TEXT,
  tracking_number TEXT,
  pdf_url TEXT,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## Environment Variables

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Testing Webhooks Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

---

## Files

| File | Purpose |
|------|---------|
| `app/api/checkout/route.ts` | Create checkout session |
| `app/api/webhook/stripe/route.ts` | Handle Stripe webhooks |
| `app/api/orders/route.ts` | List user orders |
| `app/api/orders/session/route.ts` | Get order by session |
| `lib/stripe/server.ts` | Stripe client & pricing |
| `app/order/success/` | Order success page |
