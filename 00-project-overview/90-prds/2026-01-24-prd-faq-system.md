# PRD: Multilingual FAQ System

## Introduction/Overview

This PRD outlines the development of a comprehensive, multilingual Frequently Asked Questions (FAQ) system for KidBook Creator. Based on competitive analysis of 8+ competitors in the personalized children's book market, this feature addresses critical customer information needs while reducing support burden and building trust.

**Problem Statement:** Customers need quick, self-service access to common questions about our AI-powered book creation process, pricing, shipping, returns, customization options, and legal policies. All competitors provide FAQ systems, with some offering phone support (none identified) creating an opportunity for differentiation through exceptional self-service.

**Goal:** Create a user-friendly, multilingual FAQ page that provides pre-purchase clarity, builds trust through transparency, and supports our international customer base in their native languages.

## Goals

1. **Increase Conversion:** Improve checkout completion rate by addressing pre-purchase concerns
2. **Build Trust:** Establish transparency around policies, AI quality, and processes
3. **Enable Self-Service:** Provide 24/7 access to answers in multiple languages
4. **Improve SEO:** Create indexed content that drives organic traffic
5. **Support Internationalization:** Deliver FAQ content in all supported languages (English, Hebrew, German, etc.)

## User Stories

### Primary Users: Prospective Customers

1. **As a prospective customer**, I want to understand how the AI book creation process works so that I know what to expect before purchasing.

2. **As a parent concerned about quality**, I want to see examples of AI-generated books and understand quality guarantees so that I feel confident in my purchase.

3. **As an international customer**, I want to read FAQs in my native language so that I fully understand policies and processes.

4. **As a gift buyer**, I want to know about delivery times and shipping options so that I can plan my purchase accordingly.

5. **As a budget-conscious buyer**, I want to understand all pricing, discounts, and hidden costs upfront so that I can make an informed decision.

### Secondary Users: Existing Customers

6. **As an existing customer**, I want to know how to modify or cancel my order so that I can make changes if needed.

7. **As a customer with a defective book**, I want to understand the return/refund process so that I can resolve my issue quickly.

8. **As a repeat customer**, I want to find answers about my account and order history so that I can manage my purchases.


## Top 11 FAQ Topics (Based on Competitive Analysis)

### 1. **How does the AI book creation process work?**
- **Category:** Product & Process
- **Priority:** Critical
- **Rationale:** Universal across all competitors; addresses core value proposition
- **Content Needs:**
  - Step-by-step creation flow (Choose story → Upload photo → Customize → Order)
  - AI character generation explanation
  - Photo quality requirements and tips
  - Editing capabilities
  - Preview functionality
  - Timeline from creation to delivery

### 2. **What are your pricing options and discounts?**
- **Category:** Pricing & Payments
- **Priority:** Critical
- **Rationale:** Pricing transparency drives conversion; competitors offer multi-book discounts
- **Content Needs:**
  - Single book pricing
  - Multi-book discount structure (e.g., 20% off additional books)
  - Subscription options (if applicable)
  - Promotional codes and seasonal sales
  - Currency and payment methods
  - Hidden costs disclosure (none)

### 3. **What is your shipping and delivery policy?**
- **Category:** Shipping & Delivery
- **Priority:** Critical
- **Rationale:** Top concern for gift buyers; competitors range from 3-day to 5-week delivery
- **Content Needs:**
  - Production timeline (AI generation + printing)
  - Shipping methods and costs
  - Delivery timeframes by region
  - International shipping availability
  - Order tracking process
  - Rush/expedited options

### 4. **What is your cancellation and refund policy?**
- **Category:** Legal & Policies
- **Priority:** Critical
- **Rationale:** Legal requirement; builds trust; industry standard is 24-48 hour cancellation window
- **Content Needs:**
  - Cancellation window (recommend 48 hours before production)
  - Personalized product exclusion explanation
  - Refund process and timeline
  - Defective product policy
  - How to request cancellation
  - What happens after cancellation

### 5. **What is your return policy for defective books?**
- **Category:** Legal & Policies
- **Priority:** Critical
- **Rationale:** Consumer protection requirement; Hooray Heroes offers free returns (competitive advantage)
- **Content Needs:**
  - 14-day defect reporting window
  - What qualifies as a defect vs. AI variation
  - Photographic evidence requirements
  - Return shipping (free for defects)
  - Refund or replacement options
  - Process timeline

### 6. **How do I upload photos and what quality is needed?**
- **Category:** Product & Process
- **Priority:** High
- **Rationale:** Customer pain point identified in reviews; poor photos = poor results
- **Content Needs:**
  - Photo resolution requirements (minimum 1024x1024px recommended)
  - File format support (JPG, PNG)
  - Lighting and angle guidance
  - Face visibility requirements
  - Multiple photo upload option
  - What to avoid (blurry, dark, group photos)
  - Example good vs. bad photos

### 7. **Can I customize the story, text, and illustrations?**
- **Category:** Product & Process
- **Priority:** High
- **Rationale:** Differentiation from competitors; addresses creative control concerns
- **Content Needs:**
  - Text editing capabilities
  - Illustration regeneration options
  - Character customization (name, appearance)
  - Dedication page options
  - Language selection
  - Preview before ordering
  - Limitations and boundaries

### 8. **What languages do you support?**
- **Category:** Product & Process
- **Priority:** High
- **Rationale:** International expansion; competitors support Hebrew, English, German, etc.
- **Content Needs:**
  - List of supported languages for book content
  - List of supported languages for website/interface
  - RTL (Right-to-Left) support for Hebrew/Arabic
  - Translation quality assurance
  - How to select language
  - Future language roadmap

### 9. **What if I'm not satisfied with the AI-generated results?**
- **Category:** Product & Process
- **Priority:** High
- **Rationale:** AI quality concerns identified in competitor reviews; manages expectations
- **Content Needs:**
  - AI disclaimer (imperfect results possible)
  - Preview and edit before ordering
  - Regeneration options
  - What qualifies as acceptable AI variation
  - When refunds/replacements are offered
  - Quality guarantee explanation
  - Character consistency commitment

### 10. **How do you protect my personal data and photos?**
- **Category:** Legal & Policies
- **Priority:** High
- **Rationale:** GDPR/CCPA compliance; privacy concerns with photo uploads
- **Content Needs:**
  - Data retention policy (30-90 days)
  - Photo deletion timeline
  - GDPR/CCPA compliance
  - Data security measures
  - Third-party sharing (none)
  - User rights (access, deletion)
  - Cookie policy link

## Functional Requirements

### FR1: Multilingual Support
The system must support translation of FAQ content into all supported languages.

**Sub-requirements:**
- FR1.1: Store translations for each FAQ in JSON files within `locales/` directory
- FR1.2: Detect user's language preference (browser locale, URL parameter)
- FR1.3: Display FAQ content in user's selected language
- FR1.4: Fallback to English if translation unavailable
- FR1.5: Language switcher on FAQ page
- FR1.6: Integrate with existing i18n system (`lib/i18n/`)
- FR1.7: Support RTL (Right-to-Left) layout for Hebrew/Arabic

### FR2: FAQ Public Interface
The system must provide a user-friendly interface for browsing and searching FAQs.

**Sub-requirements:**
- FR2.1: Display FAQs organized by category
- FR2.2: Collapsible/expandable FAQ items (accordion pattern)
- FR2.3: "Show All" / "Collapse All" functionality
- FR2.4: Anchor links to specific FAQs (shareable URLs)
- FR2.5: Breadcrumb navigation (Home > Help > FAQ Category)
- FR2.6: Mobile-responsive design
- FR2.7: Accessible (WCAG 2.1 AA compliant)
- FR2.8: Print-friendly view option

### FR3: Search Functionality
The system must allow users to search FAQ content.

**Sub-requirements:**
- FR3.1: Search bar prominently displayed at top of FAQ page
- FR3.2: Client-side search filtering as user types (debounced)
- FR3.3: Search across FAQ titles and content
- FR3.4: Highlight search terms in results
- FR3.5: "No results" message with suggested categories
- FR3.6: Multilingual search (search in selected language)

### FR4: Related FAQs and Cross-Linking
The system must suggest related FAQs to users.

**Sub-requirements:**
- FR4.1: Display "Related Questions" at bottom of each FAQ
- FR4.2: Manual related FAQ configuration in FAQ data
- FR4.3: Internal linking within FAQ content
- FR4.4: "Still have questions?" CTA to contact support

### FR5: SEO Optimization
The system must be optimized for search engines.

**Sub-requirements:**
- FR5.1: Unique meta titles and descriptions for FAQ pages
- FR5.2: Schema.org FAQPage structured data markup
- FR5.3: Clean, semantic URLs (e.g., `/[locale]/faq`)
- FR5.4: Sitemap inclusion
- FR5.5: Canonical URLs for multilingual versions
- FR5.6: hreflang tags for language variants
- FR5.7: Open Graph tags for social sharing

### FR6: Performance and Caching
The system must load quickly and efficiently.

**Sub-requirements:**
- FR6.1: Server-side rendering for initial page load
- FR6.2: Static generation for FAQ content (Next.js SSG)
- FR6.3: CDN caching for FAQ pages
- FR6.4: Image optimization for FAQ screenshots/examples
- FR6.5: Target page load time < 2 seconds

## Non-Goals (Out of Scope)

1. **Admin CMS:** No admin interface for managing FAQs. Content is managed directly in code/JSON files.

2. **Analytics and Tracking:** No analytics dashboard or usage tracking in initial version.

3. **Support System Integration:** No integration with ticketing or support systems.

4. **User Feedback System:** No "Was this helpful?" buttons or feedback collection.

5. **AI-Powered Chatbot:** This PRD does not include an AI chatbot for answering questions.

6. **Community Forum:** User-generated Q&A or community discussions are out of scope.

7. **Video Tutorials:** While FAQs may link to videos, video creation/hosting is separate.

8. **Live Chat Integration:** Real-time chat support is a separate feature.

9. **Bulk/Institutional Pricing:** Not relevant for current business model.

## Design Considerations

### UI/UX Requirements

**Layout Pattern:** Accordion-style FAQ list (industry standard)
- Category tabs or sidebar navigation
- Expandable/collapsible FAQ items
- Search bar at top
- Sticky navigation for long pages

**Visual Design:**
- Consistent with existing brand guidelines (`/00-project-overview/brand-guidelines/`)
- Use existing component library (if available)
- Icons for categories (question mark, shipping box, credit card, etc.)
- Clear typography hierarchy (H1 for page title, H2 for categories, H3 for questions)

**Accessibility:**
- Keyboard navigation (Tab, Enter, Arrow keys)
- Screen reader support (ARIA labels, roles)
- Focus indicators
- Sufficient color contrast
- Skip links

**Mobile Optimization:**
- Touch-friendly tap targets (minimum 44x44px)
- Readable font sizes (minimum 16px)
- Simplified navigation
- Fast loading on mobile networks

### Wireframe References

**Desktop Layout:**
```
+--------------------------------------------------+
| Logo | Navigation | Language Selector | Search   |
+--------------------------------------------------+
| Home > Help Center > FAQ                         |
+--------------------------------------------------+
|                                                  |
| [Search FAQs...........................] [🔍]   |
|                                                  |
| +-- Product & Process (8) ----------------------+|
| | ▼ How does the AI book creation work?        ||
| |   [Expanded content with images/links]       ||
| | ▶ How do I upload photos?                    ||
| | ▶ Can I customize the story?                 ||
| +----------------------------------------------+|
|                                                  |
| +-- Pricing & Payments (4) --------------------+|
| | ▶ What are your pricing options?             ||
| | ▶ Do you offer bulk pricing?                 ||
| +----------------------------------------------+|
|                                                  |
| [Show All] [Collapse All]                       |
|                                                  |
| Still have questions? [Contact Support]         |
+--------------------------------------------------+
```

**Mobile Layout:**
```
+----------------------+
| ☰ | FAQ | 🔍 | 🌐    |
+----------------------+
| [Search...........]  |
+----------------------+
| Categories ▼         |
| - Product & Process  |
| - Pricing            |
| - Shipping           |
| - Legal              |
+----------------------+
| ▶ How does AI work? |
| ▶ Upload photos?    |
| ▶ Pricing options?  |
+----------------------+
| [Contact Support]    |
+----------------------+
```

### Component Specifications

**FAQ Item Component:**
- Props: `id`, `question`, `answer`, `category`, `relatedFaqs`, `locale`
- State: `isExpanded` (boolean)
- Events: `onToggle`, `onFeedback`
- Styling: Matches existing design system

**Search Component:**
- Props: `placeholder`, `onSearch`, `locale`
- State: `query`, `results`, `isLoading`
- Debounce: 300ms
- Min characters: 2

**Category Navigation:**
- Props: `categories`, `activeCategory`, `onCategoryChange`
- Sticky positioning on scroll
- Active state indicator

## Technical Considerations

### Data Structure

**FAQ JSON Structure:**
FAQs will be stored in locale-specific JSON files following the existing i18n pattern.

```typescript
// locales/en/faq.json
{
  "categories": [
    {
      "id": "product-process",
      "title": "Product & Process",
      "faqs": [
        {
          "id": "ai-creation-process",
          "question": "How does the AI book creation process work?",
          "answer": "Our AI-powered process is simple...",
          "relatedFaqs": ["photo-upload", "customize-story"]
        }
      ]
    },
    {
      "id": "pricing-payments",
      "title": "Pricing & Payments",
      "faqs": [...]
    }
  ]
}
```

```typescript
// locales/he/faq.json
{
  "categories": [
    {
      "id": "product-process",
      "title": "מוצר ותהליך",
      "faqs": [
        {
          "id": "ai-creation-process",
          "question": "איך עובד תהליך יצירת הספר עם AI?",
          "answer": "התהליך שלנו מבוסס AI פשוט...",
          "relatedFaqs": ["photo-upload", "customize-story"]
        }
      ]
    }
  ]
}
```

### Integration Points

**Existing Systems:**
- **i18n System:** Integrate with `lib/i18n/config.ts` and `lib/i18n/provider.tsx`
- **Locales:** Store translations in `locales/[locale]/faq.json` following existing pattern

**File Structure:**
```
app/
  [locale]/
    faq/
      page.tsx              # Main FAQ page

components/
  FAQ/
    FAQList.tsx             # FAQ list component
    FAQItem.tsx             # Individual FAQ item
    FAQSearch.tsx           # Search component
    FAQCategory.tsx         # Category navigation
    index.ts

locales/
  en/
    faq.json                # English FAQ content
  he/
    faq.json                # Hebrew FAQ content
  de/
    faq.json                # German FAQ content

lib/
  faq/
    types.ts                # TypeScript types
    utils.ts                # Helper functions
```

### Dependencies

**No New Dependencies Required:**
- Use existing Next.js (app router)
- Use existing React
- Use existing TypeScript
- Use existing i18n system
- Client-side search with native JavaScript (no external library needed)

### Performance Targets

- FAQ page load time: < 2 seconds
- Search response time: < 300ms
- Time to Interactive (TTI): < 3 seconds
- Lighthouse Performance Score: > 90
- Core Web Vitals: Pass all metrics

### Security Considerations

- **XSS Prevention:** Sanitize FAQ content when rendering (use React's built-in escaping)
- **Content Validation:** Validate FAQ JSON structure at build time
- **No Admin Access:** Content managed through code, no admin endpoints to secure

## Success Metrics

### Primary Metrics

1. **FAQ Page Views**
   - Target: Track baseline usage
   - Measurement: Page views on `/[locale]/faq`
   - Tracking: Google Analytics

2. **Conversion Impact**
   - Target: 15% increase in checkout completion rate
   - Measurement: Compare conversion funnel before/after FAQ launch
   - Tracking: Users who visit FAQ during checkout journey

3. **Multilingual Adoption**
   - Target: 30% of non-English visitors use translated FAQs
   - Measurement: FAQ views by locale / Total non-English visitors
   - Tracking: Locale in URL path

### Secondary Metrics

4. **Page Performance**
   - Target: < 2 second page load time
   - Measurement: Google Analytics page load time
   - Tracking: Core Web Vitals

5. **SEO Impact**
   - Target: 20% increase in organic traffic to help content
   - Measurement: Google Search Console impressions/clicks
   - Tracking: FAQ page rankings for target keywords

6. **Mobile Usage**
   - Target: 50% of FAQ views on mobile devices
   - Measurement: Mobile vs. desktop FAQ page views
   - Tracking: Device type in analytics

## Open Questions

1. **Translation Workflow:** Should we use professional translation services or AI translation for non-English FAQs?
   - **Recommendation:** Professional translation for all 11 FAQs to ensure accuracy, especially for legal/policy content.

2. **FAQ Versioning:** Do we need version history for FAQ content changes?
   - **Recommendation:** Use Git for version control. All changes tracked through commits.

3. **Video Content:** Should FAQs include embedded video tutorials?
   - **Recommendation:** Phase 2 feature. Start with text/images only.

4. **FAQ in Checkout Flow:** Should we show contextual FAQs during checkout?
   - **Recommendation:** Phase 2. Start with standalone FAQ page, add contextual widgets later.

5. **Print-Friendly Version:** Do users need a printer-friendly FAQ page?
   - **Recommendation:** Yes, add print stylesheet. Low effort, high value.

6. **FAQ Categories:** Should categories be fixed or configurable?
   - **Recommendation:** Fixed categories in JSON structure (Product, Pricing, Shipping, Legal).

7. **Related Products:** Should FAQs link to related products?
   - **Recommendation:** Yes, include links within FAQ answers where relevant.

8. **Accessibility Testing:** What level of accessibility testing is required?
   - **Recommendation:** WCAG 2.1 AA compliance required. Use automated tools (axe, Lighthouse) + manual testing.

---

## Implementation Phases

### Phase 1: MVP (Weeks 1-2)
- Create FAQ page component structure
- Implement accordion UI with categories
- Client-side search functionality
- Create FAQ JSON structure in locales
- Write 11 FAQ content in English
- SEO optimization (schema markup, meta tags)
- Mobile-responsive design
- Accessibility compliance

### Phase 2: Multilingual (Weeks 3-4)
- Professional translation to Hebrew and German
- RTL layout support for Hebrew
- Language switcher integration
- Test all translations
- Multilingual search support

### Phase 3: Polish (Week 5)
- Performance optimization
- Print stylesheet
- Related FAQs linking
- Final accessibility testing
- Cross-browser testing
- Deploy to production

---

## Appendix: Competitive FAQ Analysis Summary

### Wonderbly
- Comprehensive help center with FAQs
- Categories: Delivery, Returns, Privacy, Accessibility
- No phone support (email only)
- Clear policies documented

### Hooray Heroes
- FAQ sections for payment and delivery
- 24-hour cancellation window
- Free returns policy (unique competitive advantage)
- Order tracking available
- 3-day shipping highlighted

### Childbook.ai
- FAQ page available (https://www.childbook.ai/faq)
- 7-day money-back guarantee
- Clear terms & conditions
- Subscription cancellation policy
- No refunds for unused credits

### MeBook.ai
- English and Hebrew FAQ support
- 3-step process highlighted
- Free worldwide shipping
- Cannot cancel once creation begins
- 23% multi-book discount

### BOOQLI
- "Why Choose Us?" educational content
- Age-appropriate content explanation
- Quality and pricing transparency
- Bulk/institutional pricing available
- Educational focus in FAQ content

### Common Patterns Across All Competitors
1. Self-service emphasis (no phone support)
2. Personalized product exclusion from returns
3. 14-day defect reporting window
4. Photo quality guidance needed
5. AI disclaimer about imperfect results
6. Clear cancellation windows (24-48 hours)
7. Shipping and delivery information
8. Privacy and data protection policies
9. Payment methods and security
10. Multi-book discount strategies

---

## Translation Requirements

### Priority Languages (Phase 2)
1. **English (en)** - Primary language, 100% complete
2. **Hebrew (he)** - High priority, Israeli market focus, RTL support required
3. **German (de)** - High priority, European market

### Future Languages (Phase 3+)
4. Spanish (es)
5. French (fr)
6. Arabic (ar) - RTL support required
7. Russian (ru)
8. Portuguese (pt)

### Translation Workflow
1. Admin creates FAQ in English (source language)
2. Professional translation service translates top 12 FAQs
3. Admin reviews and approves translations
4. Translations published simultaneously with English
5. AI translation with human review for additional FAQs
6. Community feedback mechanism for translation improvements

### Translation Quality Standards
- Professional translation for legal/policy FAQs (liability risk)
- AI translation acceptable for product/process FAQs (with review)
- Native speaker review required before publishing
- Cultural adaptation (not just literal translation)
- Consistent terminology across all FAQs

---

**Document Version:** 1.0  
**Last Updated:** January 27, 2026  
**Author:** Product Team  
**Status:** Ready for Review
