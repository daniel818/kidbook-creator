# Analytics Integration

This project uses **Mixpanel** for product analytics tracking across both client and server.

## Setup

Add your Mixpanel token to `.env.local`:

```bash
NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_project_token
```

## Architecture

```
lib/analytics/
├── index.ts   # Client-side: init, track, hooks
└── server.ts  # Server-side: webhook/API tracking
```

## Usage

### Client-Side (React Components)

```typescript
import { track, EVENTS, useAnalyticsInit, useIdentify } from '@/lib/analytics';

// In root layout - initialize analytics & identify user
function RootLayout() {
    useAnalyticsInit();
    useIdentify();
    return <>{children}</>;
}

// Track events anywhere
track(EVENTS.BOOK_CREATED, {
    book_id: 'abc123',
    book_title: 'My Book',
    generation_time_ms: 5000,
});
```

### Server-Side (API Routes / Webhooks)

```typescript
import { trackPaymentCompleted, trackOrderPlaced } from '@/lib/analytics/server';

// In Stripe webhook after successful payment
trackPaymentCompleted(userId, {
    book_id: 'abc123',
    payment_type: 'digital_unlock',
    amount_usd: 4.99,
    payment_method: 'card',
    stripe_payment_intent_id: 'pi_xxx',
});
```

## Event Taxonomy

| Event | When Fired | Location |
|-------|------------|----------|
| `user_signed_up` | New user registers | AuthModal |
| `user_signed_in` | Existing user logs in | AuthModal |
| `user_signed_out` | User logs out | useIdentify hook |
| `book_creation_started` | User clicks "Generate" | /create page |
| `book_created` | Book successfully generated | /create page |
| `book_creation_failed` | Generation error | /create page |
| `book_viewed` | User opens book viewer | /book/[id] page |
| `mybooks_viewed` | User opens My Books | /mybooks page |
| `orders_viewed` | User opens Orders | /orders page |
| `checkout_started` | User enters order page | Order page |
| `payment_completed` | Stripe payment succeeds | Stripe webhook |
| `payment_failed` | Stripe payment fails | Stripe webhook |
| `order_placed` | Print order confirmed | Stripe webhook |

## Adding New Events

1. Add event name to `EVENTS` constant in `lib/analytics/index.ts`
2. Call `track(EVENTS.YOUR_EVENT, { ...props })` where needed
3. For server-side events, add a wrapper function in `server.ts`

## Graceful Degradation

If `NEXT_PUBLIC_MIXPANEL_TOKEN` is not set:
- Events are logged to console in development
- No errors thrown in production
- App continues to function normally

## Testing

1. Set token in `.env.local`
2. Run `npm run dev`
3. Open Mixpanel → Live View
4. Perform actions and verify events appear
