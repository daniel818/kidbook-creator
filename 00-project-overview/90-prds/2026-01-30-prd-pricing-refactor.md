# PRD: Pricing Model Refactor - Fixed Pricing

**Date:** 2026-01-30  
**Branch:** `pricing-refactor`  
**Status:** Planning  
**Priority:** High

---

## Overview

Refactor the pricing model from Lulu API-based dynamic pricing to a fixed pricing model where KidBook Creator sets transparent prices to customers. Lulu remains our print provider (transparent to users), but pricing is now controlled by KidBook Creator, not passed through from Lulu.

**Problem it solves:**
- Current implementation exposes Lulu pricing directly to users
- Users see "Unavailable" when Lulu API fails
- No control over pricing strategy or margins
- Confusing user experience with variable pricing

**Goal:** Implement fixed, transparent pricing that is independent of third-party provider costs.

---

## Pricing Structure

### Fixed Prices (USD)
- **Digital Only:** $14.99 USD
- **Print + Digital:** $39.99 USD (before shipping)

### Currency Conversion
Prices must support multiple currencies with proper conversion:
- **USD:** $14.99 (digital), $39.99 (print)
- **EUR:** €13.99 (digital), €36.99 (print)
- **ILS:** ₪54.99 (digital), ₪144.99 (print)

### Shipping
- **Digital Only:** Free (instant download)
- **Print + Digital:** Calculated based on destination (via Lulu shipping API)

---

## Tasks & Implementation

### 1. Create Pricing Constants Module

**Priority:** High  
**Status:** ⏳ Pending

**Description:** Create a centralized pricing configuration file with currency support.

**Files to create:**
- `lib/pricing/constants.ts`

**Implementation:**
```typescript
// lib/pricing/constants.ts
export type Currency = 'USD' | 'EUR' | 'ILS';
export type ProductType = 'digital' | 'print';

export interface PricingConfig {
  currency: Currency;
  symbol: string;
  digital: number;
  print: number;
}

export const PRICING: Record<Currency, PricingConfig> = {
  USD: {
    currency: 'USD',
    symbol: '$',
    digital: 14.99,
    print: 39.99
  },
  EUR: {
    currency: 'EUR',
    symbol: '€',
    digital: 13.99,
    print: 36.99
  },
  ILS: {
    currency: 'ILS',
    symbol: '₪',
    digital: 54.99,
    print: 144.99
  }
};

export function getPrice(currency: Currency, productType: ProductType): number {
  return PRICING[currency][productType];
}

export function formatPrice(amount: number, currency: Currency): string {
  const config = PRICING[currency];
  return `${config.symbol}${amount.toFixed(2)}`;
}
```

---

### 2. Update Order Page Pricing Logic

**Priority:** High  
**Status:** ⏳ Pending

**Description:** Replace Lulu API pricing calls with fixed pricing from constants.

**Files to modify:**
- `app/create/[bookId]/order/page.tsx`

**Changes:**
1. Remove dependency on Lulu pricing API for book price
2. Use fixed pricing from `lib/pricing/constants.ts`
3. Keep Lulu shipping API for shipping cost calculation only
4. Update pricing display to show fixed prices immediately (no loading state for book price)
5. Remove "Unavailable" state for book pricing (always show fixed price)

**Implementation Details:**
- Digital orders: Show $14.99, no shipping
- Print orders: Show $39.99 + calculated shipping
- Currency detection based on user's locale or selection
- Shipping still calculated via Lulu API (for print orders only)

---

### 3. Update Pricing Page

**Priority:** High  
**Status:** ⏳ Pending

**Description:** Ensure pricing page displays correct fixed prices.

**Files to modify:**
- `app/[locale]/pricing/page.tsx`
- `locales/en.json`, `locales/de.json`, `locales/he.json`

**Changes:**
1. Update pricing cards to show $14.99 (digital) and $39.99 (print)
2. Add note about shipping costs for print orders
3. Ensure currency conversion is accurate for EUR and ILS
4. Update any pricing-related copy to reflect fixed pricing model

---

### 4. Add Third-Party Provider FAQ to Pricing Page

**Priority:** Medium  
**Status:** ⏳ Pending

**Description:** Add FAQ section on pricing page explaining our printing partnership.

**Files to modify:**
- `app/[locale]/pricing/page.tsx`
- `locales/en.json`, `locales/de.json`, `locales/he.json`

**FAQ Content (English):**

**Q: Who prints my book?**  
A: We partner with a high-quality, professional printing provider to ensure your book is produced to the highest standards. While we handle all customer service, pricing, and delivery coordination, our trusted printing partner manufactures your book using premium materials and state-of-the-art printing technology. This partnership allows us to offer you exceptional quality at competitive prices.

**Q: Why don't you print in-house?**  
A: By partnering with specialized printing experts, we can focus on what we do best—creating magical, personalized stories for your child—while ensuring your book is printed with professional-grade quality, eco-friendly materials, and reliable delivery. Our printing partner has decades of experience and can handle orders worldwide.

**Q: Does this affect the quality of my book?**  
A: Absolutely not! Our printing partner is carefully selected for their commitment to quality. Every book is printed on premium paper with vibrant, fade-resistant inks and durable binding. We maintain strict quality control standards to ensure your book exceeds expectations.

---

### 5. Add Third-Party Provider FAQ to Main FAQ Page

**Priority:** Medium  
**Status:** ⏳ Pending

**Description:** Add the same FAQ about printing partnership to the main FAQ page.

**Files to modify:**
- `locales/en.json`, `locales/de.json`, `locales/he.json` (FAQ section)

**Implementation:**
- Add new FAQ item under "Product & Quality" category
- Use same Q&A content as pricing page
- Ensure translations for DE and HE

---

### 6. Remove Lulu Pricing API Dependency

**Priority:** High  
**Status:** ⏳ Pending

**Description:** Clean up code to remove unused Lulu pricing API calls.

**Files to modify:**
- `app/create/[bookId]/order/page.tsx`
- `app/api/lulu/calculate-cost/route.ts` (if exists)

**Changes:**
1. Remove `/api/lulu/calculate-cost` endpoint (or refactor to only calculate shipping)
2. Remove `fetchPrice` function that calls Lulu for book pricing
3. Keep Lulu shipping API integration for shipping cost calculation
4. Remove price loading states and error handling for book price
5. Simplify pricing display logic

---

### 7. Update Currency Detection Logic

**Priority:** Medium  
**Status:** ⏳ Pending

**Description:** Implement proper currency detection based on user locale.

**Files to modify:**
- `app/create/[bookId]/order/page.tsx`
- `lib/pricing/constants.ts`

**Implementation:**
```typescript
function getCurrencyFromLocale(locale: string): Currency {
  if (locale.startsWith('de')) return 'EUR';
  if (locale.startsWith('he')) return 'ILS';
  return 'USD'; // Default
}
```

---

### 8. Add Translations for New FAQ Content

**Priority:** Medium  
**Status:** ⏳ Pending

**Description:** Add translations for third-party provider FAQ in all languages.

**Files to modify:**
- `locales/en.json`
- `locales/de.json`
- `locales/he.json`

**Translation Keys:**
```json
{
  "pricing": {
    "faq": {
      "printingPartner": {
        "question": "Who prints my book?",
        "answer": "We partner with a high-quality, professional printing provider..."
      },
      "whyNotInHouse": {
        "question": "Why don't you print in-house?",
        "answer": "By partnering with specialized printing experts..."
      },
      "qualityImpact": {
        "question": "Does this affect the quality of my book?",
        "answer": "Absolutely not! Our printing partner is carefully selected..."
      }
    }
  }
}
```

---

## Implementation Phases

### Phase 1: Core Pricing Refactor
**Estimated Time:** 2-3 hours

1. Create pricing constants module
2. Update order page to use fixed pricing
3. Remove Lulu pricing API dependency
4. Test pricing display in all currencies

### Phase 2: Content Updates
**Estimated Time:** 1-2 hours

1. Update pricing page with correct prices
2. Add FAQ to pricing page
3. Add FAQ to main FAQ page
4. Add translations (DE, HE)

### Phase 3: Testing & Validation
**Estimated Time:** 1 hour

1. Test order flow with digital orders
2. Test order flow with print orders
3. Verify shipping calculation still works
4. Test all three currencies (USD, EUR, ILS)
5. Verify FAQ content displays correctly

---

## Technical Details

### Current Flow (To Be Removed)
1. User selects book options
2. Frontend calls `/api/lulu/calculate-cost`
3. Lulu API returns pricing
4. Display price to user
5. **Problem:** API failures show "Unavailable"

### New Flow
1. User selects book options
2. Frontend reads from `PRICING` constants
3. Display fixed price immediately (no API call)
4. For print orders: Calculate shipping via Lulu API (separate call)
5. **Benefit:** Always show price, no dependency on Lulu for pricing

### Shipping Calculation (Unchanged)
- Shipping costs still calculated via Lulu API
- Only applies to print orders
- Digital orders have $0 shipping

---

## Acceptance Criteria

### Phase 1
- [ ] `lib/pricing/constants.ts` created with USD, EUR, ILS pricing
- [ ] Order page displays $14.99 for digital orders
- [ ] Order page displays $39.99 for print orders (before shipping)
- [ ] No "Unavailable" state for book pricing
- [ ] Lulu pricing API calls removed
- [ ] Shipping calculation still works for print orders

### Phase 2
- [ ] Pricing page shows correct fixed prices
- [ ] FAQ about printing partner added to pricing page
- [ ] FAQ about printing partner added to main FAQ page
- [ ] All FAQ content translated to DE and HE

### Phase 3
- [ ] Digital order shows $14.99, free shipping
- [ ] Print order shows $39.99 + calculated shipping
- [ ] EUR pricing displays correctly (€13.99 / €36.99)
- [ ] ILS pricing displays correctly (₪54.99 / ₪144.99)
- [ ] FAQ content renders properly in all languages

---

## Files to Modify

### New Files
- `lib/pricing/constants.ts` - Pricing configuration

### Modified Files
- `app/create/[bookId]/order/page.tsx` - Order page pricing logic
- `app/[locale]/pricing/page.tsx` - Pricing page display
- `locales/en.json` - English translations
- `locales/de.json` - German translations
- `locales/he.json` - Hebrew translations

### Files to Review/Remove
- `app/api/lulu/calculate-cost/route.ts` - May need refactoring or removal

---

## Notes

- **Lulu remains our provider** - This is transparent to users
- **Shipping still via Lulu API** - Only book pricing is fixed
- **Margins are built into fixed prices** - We control profitability
- **Currency conversion** - Use realistic exchange rates
- **Future flexibility** - Easy to adjust prices by updating constants

---

## Success Metrics

- **Reduced API dependency:** No Lulu calls for book pricing
- **Improved UX:** No "Unavailable" pricing states
- **Faster load times:** Instant price display (no API wait)
- **Better control:** Ability to adjust pricing strategy
- **Transparency:** Clear, consistent pricing for users

---

## Risks & Mitigation

**Risk:** Shipping API failure  
**Mitigation:** Show estimated shipping range, allow order to proceed

**Risk:** Currency conversion inaccuracy  
**Mitigation:** Review rates quarterly, adjust as needed

**Risk:** Price changes require code deployment  
**Mitigation:** Future enhancement - move to database/CMS

---

## Future Enhancements

1. **Dynamic pricing from database** - Allow price updates without deployment
2. **Regional pricing** - Different prices for different countries
3. **Promotional pricing** - Discount codes and special offers
4. **Subscription model** - Monthly plans for multiple books
