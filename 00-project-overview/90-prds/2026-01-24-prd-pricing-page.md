# Product Requirements Document: Pricing Page

## Introduction/Overview

Create a fun and engaging pricing page that displays KidBook Creator's book pricing in a clear, interactive matrix format. The page will showcase pricing for both digital and printed books across three package tiers (single, double, triple), helping users understand their options before creating a book. This page will be positioned in the main navigation between "Community Books" and "FAQ".

**Problem it solves:** Users currently have no visibility into pricing until they complete the book creation process. This creates friction and uncertainty, potentially leading to abandoned book creations. A dedicated pricing page provides transparency and helps users make informed decisions upfront.

**Goal:** Increase user confidence and conversion rates by providing clear, upfront pricing information in an engaging, easy-to-understand format.

---

## Goals

1. **Transparency:** Display all pricing options clearly before users start creating books
2. **Engagement:** Create a fun, interactive pricing experience that aligns with the playful brand
3. **Conversion:** Help users understand value propositions for different package tiers
4. **Accessibility:** Ensure pricing is clear in all supported languages (EN, DE, HE) with proper RTL support
5. **Navigation:** Seamlessly integrate the pricing page into the existing navigation structure

---

## User Stories

1. **As a parent**, I want to see pricing options before creating a book so that I can budget appropriately and decide which format works best for me.

2. **As a cost-conscious user**, I want to compare digital vs printed pricing across different quantities so that I can choose the most economical option for my needs.

3. **As a gift-giver**, I want to understand bulk pricing (double/triple packages) so that I can purchase multiple books for siblings or gifts at a better rate.

4. **As an international user**, I want to see pricing in my language with proper formatting so that I can understand costs in my context.

5. **As a mobile user**, I want the pricing matrix to be responsive and easy to read on my phone so that I can check prices on the go.

---

## Functional Requirements

### FR1: Pricing Matrix Display
The page must display a pricing matrix with:
- **Columns:** Digital and Printed formats
- **Rows:** Single (1 book), Double (2 books), Triple (3 books) packages
- **Pricing values:**
  - Single: Digital $15, Printed $45
  - Double: Digital $14/book ($28 total), Printed $41/book ($82 total)
  - Triple: Digital $12/book ($36 total), Printed $37/book ($111 total)

### FR2: Visual Design
- Use engaging, playful design elements that match KidBook Creator's brand
- Include visual indicators for "best value" or "most popular" options
- Use color coding to differentiate between digital and printed options
- Include icons or illustrations to make the page more engaging
- Ensure proper spacing and readability

### FR3: Internationalization
- Create new translation namespace `pricing.json` for all pricing page content
- Support all three languages: English (EN), German (DE), Hebrew (HE)
- Implement proper RTL layout for Hebrew
- Use currency formatting appropriate for each locale
- Translate all labels, descriptions, and call-to-action text

### FR4: Navigation Integration
- Add "Pricing" link to navbar between "Community Books" and "FAQ"
- Update `Navbar.tsx` to include the new pricing link
- Add translation keys to `navbar.json` for all languages
- Ensure active state styling works correctly
- Initially set as enabled (not disabled like other placeholder pages)

### FR5: Responsive Design
- Mobile-first approach with breakpoints for tablet and desktop
- Pricing matrix should stack vertically on mobile
- Maintain readability across all screen sizes
- Touch-friendly interactive elements

### FR6: Call-to-Action
- Include clear CTA button(s) directing users to create a book
- CTA should be prominent but not overwhelming
- Link to `/create` route

### FR7: Additional Information
- Include brief explanations of what's included in digital vs printed
- Add FAQ-style expandable sections for common pricing questions
- Clarify that printed books include shipping costs (or specify if separate)
- Mention any applicable taxes or additional fees

### FR8: Page Route
- Create page at route `/pricing`
- Use Next.js App Router structure: `app/[locale]/pricing/page.tsx`
- Implement proper metadata for SEO

---

## Non-Goals (Out of Scope)

1. **Dynamic Pricing:** Pricing values are hardcoded, not fetched from a database or API
2. **Payment Processing:** This page only displays pricing, does not handle transactions
3. **Custom Pricing:** No ability for users to calculate custom quantities beyond 1, 2, or 3
4. **Promotional Codes:** No discount code functionality on this page
5. **Detailed Shipping Calculator:** No country-specific shipping cost breakdown
6. **Print Format Options:** No display of softcover/hardcover or size variations (keep it simple)
7. **Currency Conversion:** Display in USD only, no multi-currency support

---

## Design Considerations

### Component Structure
```
PricingPage/
├── page.tsx (main page component)
├── PricingPage.module.css (styles)
└── components/
    ├── PricingMatrix/ (pricing table component)
    │   ├── PricingMatrix.tsx
    │   └── PricingMatrix.module.css
    ├── PricingCard/ (individual pricing option)
    │   ├── PricingCard.tsx
    │   └── PricingCard.module.css
    └── PricingFAQ/ (expandable FAQ section)
        ├── PricingFAQ.tsx
        └── PricingFAQ.module.css
```

### UI/UX Guidelines
- **Color Scheme:** Use brand colors (purple/blue gradient theme visible in navbar)
- **Typography:** Clear hierarchy with large, readable pricing numbers
- **Spacing:** Generous whitespace for clarity
- **Animations:** Subtle hover effects on pricing cards
- **Icons:** Use consistent icon style (consider Lucide icons if already in project)
- **Accessibility:** WCAG 2.1 AA compliance, proper ARIA labels, keyboard navigation

### Pricing Matrix Layout (Desktop)
```
┌─────────────────────────────────────────────────┐
│              Pricing Options                     │
├──────────────┬──────────────┬──────────────────┤
│   Package    │   Digital    │     Printed      │
├──────────────┼──────────────┼──────────────────┤
│   Single     │    $15       │      $45         │
│   (1 book)   │              │                  │
├──────────────┼──────────────┼──────────────────┤
│   Double     │  $14/book    │   $41/book       │
│   (2 books)  │  $28 total   │   $82 total      │
│              │  [BEST VALUE]│                  │
├──────────────┼──────────────┼──────────────────┤
│   Triple     │  $12/book    │   $37/book       │
│   (3 books)  │  $36 total   │   $111 total     │
└──────────────┴──────────────┴──────────────────┘
```

### RTL Considerations
- Mirror layout for Hebrew
- Ensure pricing matrix reads naturally right-to-left
- Test all interactive elements in RTL mode
- Use CSS logical properties (`margin-inline-start`, etc.)

---

## Technical Considerations

### Dependencies
- **react-i18next:** Already in use for translations
- **Next.js App Router:** Use existing routing structure
- **CSS Modules:** Follow existing pattern for styling
- **No new external libraries required**

### File Locations
- **Page:** `app/[locale]/pricing/page.tsx`
- **Components:** `components/PricingMatrix/`, `components/PricingCard/`, `components/PricingFAQ/`
- **Translations:** `locales/{en,de,he}/pricing.json`
- **Navbar updates:** `components/Navbar/Navbar.tsx`, `locales/{en,de,he}/navbar.json`

### Translation Namespace Structure
```json
{
  "title": "Pricing",
  "subtitle": "Choose the perfect package for your story",
  "matrix": {
    "package": "Package",
    "digital": "Digital",
    "printed": "Printed",
    "single": "Single",
    "double": "Double", 
    "triple": "Triple",
    "book": "book",
    "books": "books",
    "perBook": "per book",
    "total": "total",
    "bestValue": "Best Value"
  },
  "features": {
    "digitalIncludes": "Digital includes:",
    "digitalFeature1": "Instant download",
    "digitalFeature2": "PDF format",
    "digitalFeature3": "Print at home",
    "printedIncludes": "Printed includes:",
    "printedFeature1": "Professional printing",
    "printedFeature2": "Premium paper quality",
    "printedFeature3": "Shipping included"
  },
  "cta": {
    "primary": "Start Creating",
    "secondary": "Learn More"
  },
  "faq": {
    "title": "Pricing Questions",
    "q1": "What's included in the printed price?",
    "a1": "...",
    "q2": "Can I order more than 3 books?",
    "a2": "...",
    "q3": "What payment methods do you accept?",
    "a3": "..."
  }
}
```

### Integration with Existing Systems
- **Navbar:** Update `navLinks` array to include pricing link
- **i18n Config:** Register new `pricing` namespace in `lib/i18n/config.ts`
- **Routing:** Ensure locale prefix works correctly (`/en/pricing`, `/de/pricing`, `/he/pricing`)

---

## Success Metrics

1. **User Engagement:**
   - 40%+ of new visitors view the pricing page before creating a book
   - Average time on page: 30+ seconds
   - Low bounce rate (<50%)

2. **Conversion Impact:**
   - 15% increase in book creation completion rate
   - Reduction in abandoned book creations
   - Increase in multi-book purchases (double/triple packages)

3. **Technical Performance:**
   - Page load time <2 seconds
   - No translation errors in any language
   - 100% mobile responsiveness score

4. **User Feedback:**
   - Positive sentiment in user surveys about pricing clarity
   - Reduced support tickets about pricing questions

---

## Open Questions - RESOLVED

1. **Shipping Costs:** ✅ RESOLVED - Shipping costs are based on country and will be calculated at checkout. Add disclaimer on pricing page.

2. **Tax Display:** ✅ RESOLVED - Add standard disclaimer: "Taxes calculated at checkout as per local regulations"

3. **Page Format Options:** ✅ RESOLVED - Keep pricing simple, add general information about print specifications with note that details will be addressed in creation flow

4. **Promotional Badges:** ✅ RESOLVED - Add "Best Value" badge to double package (digital)

5. **Comparison Features:** Keep simple for now - just pricing matrix and basic feature lists

6. **Analytics:** Track CTA clicks, package selection, currency changes, time on page

7. **A/B Testing:** Not in initial implementation

8. **Currency Support:** ✅ RESOLVED - Support USD, EUR, ILS with currency selector integrated into language/region switcher

9. **Print Specifications:** ✅ RESOLVED - Add general information section, detailed specs handled in creation flow

10. **Bulk Orders:** Add note in FAQ section about contacting for larger orders

---

## Implementation Notes for Developer

- Follow existing component patterns in the codebase
- Use `'use client'` directive for interactive components
- Implement proper TypeScript types for all props
- Follow CSS module naming conventions (camelCase)
- Test in all three languages before marking complete
- Ensure proper SEO metadata (title, description)
- Add proper alt text for any images/icons used
- Implement loading states if needed
- Follow accessibility best practices (semantic HTML, ARIA labels)
- Consider adding Storybook stories for components if project uses Storybook

---

## Related Documentation

- `README-COMPONENT-TRANSLATION.md` - Translation implementation guide
- `README-INTERNATIONALIZATION.md` - i18n system overview
- `README-CHECKOUT-PAYMENTS.md` - Payment system context
- Navbar component - Navigation integration reference
