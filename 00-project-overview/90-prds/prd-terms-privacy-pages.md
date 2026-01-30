# Product Requirements Document: Terms of Service and Privacy Policy Pages

## Introduction/Overview

Create comprehensive, legally compliant Terms of Service and Privacy Policy pages for KidBook Creator. Based on extensive competitive analysis of 8+ competitors in the personalized children's book market, these pages will establish legal compliance, build customer trust, and provide transparent information about our services, data practices, and user rights.

**Problem it solves:** Legal compliance is mandatory for operating in multiple jurisdictions (EU/US/IL). Customers need clear information about their rights, our obligations, and how we handle their data and photos. Competitor analysis shows all major players have comprehensive legal policies, with some using them as competitive advantages (e.g., Hooray Heroes' free returns policy).

**Goal:** Create legally robust, user-friendly legal pages that comply with GDPR/CCPA, build trust through transparency, support our international customer base, and provide clear guidelines for using our AI-powered book creation service.

---

## Goals

1. **Legal Compliance:** Ensure full compliance with GDPR (EU), CCPA (California), and other applicable regulations
2. **Build Trust:** Establish transparency around policies, AI quality, data handling, and user rights
3. **Risk Mitigation:** Protect the business with proper legal terms, limitations, and disclaimers
4. **User Clarity:** Make legal terms understandable for non-lawyers while maintaining legal precision
5. **International Support:** Deliver legal content in all supported languages (EN, DE, HE) with proper RTL support

---

## User Stories

### Primary Users: Prospective Customers

1. **As a prospective customer**, I want to understand my rights and obligations so that I can make an informed purchase decision.

2. **As a parent concerned about privacy**, I want to know how my children's photos and personal data are protected so that I feel comfortable using the service.

3. **As an international customer**, I want to read legal terms in my native language so that I fully understand my rights and local laws apply.

4. **As a gift buyer**, I want to understand cancellation and return policies so that I know my options if something goes wrong.

5. **As a budget-conscious buyer**, I want transparent pricing information with no hidden fees so that I can trust the company.

### Secondary Users: Existing Customers

6. **As an existing customer**, I want to know my rights regarding data deletion and privacy so that I can control my personal information.

7. **As a customer with an issue**, I want to understand the refund and defect resolution process so that I can resolve problems effectively.

8. **As a repeat customer**, I want to understand how my data is used for service improvement so that I can make informed choices.

---

## Competitive Analysis Insights

### Universal Legal Standards (All Competitors)

1. **Personalized Product Exclusion:** All competitors exclude personalized products from standard return rights (EU Directive Article 16(c))
2. **24-48 Hour Cancellation Window:** Industry standard before production begins
3. **14-Day Defect Reporting:** Standard window for reporting manufacturing defects
4. **Limited Liability:** Maximum liability capped at purchase price, direct damage only
5. **AI Disclaimers:** Required for AI-generated products regarding imperfect results
6. **User Content Responsibility:** Users warrant no IP infringement and indemnify the company
7. **Data Protection:** GDPR/CCPA compliant privacy policies required

### Competitive Advantages Observed

1. **Hooray Heroes:** Free returns policy (unique in market)
2. **Childbook.ai:** 7-day money-back guarantee
3. **Magical Children's Book:** Comprehensive AI quality standards and photo deletion policies
4. **Wonderbly:** Clear accessibility statements and inclusive policies

### Legal Requirements Identified

1. **GDPR Compliance:** Required for EU customers
2. **CCPA Compliance:** Required for California customers
3. **Cookie Consent:** Required for EU website visitors
4. **Age Restrictions:** 16+ (EU) or 13+ (US) for account creation
5. **Data Retention:** Specific time limits for photos and personal data
6. **Right to Deletion:** User must be able to request data deletion

---

## Functional Requirements

### FR1: Terms of Service Page

The system must provide a comprehensive Terms of Service page covering all legal aspects of the service.

**Sub-requirements:**
- FR1.1: Scope and applicability section
- FR1.2: Ordering process and order acceptance terms
- FR1.3: Pricing and payment terms
- FR1.4: Cancellation and return policy (24-48 hour window)
- FR1.5: Delivery and shipping terms
- FR1.6: Intellectual property rights
- FR1.7: User content responsibilities and restrictions
- FR1.8: AI-generated content disclaimers
- FR1.9: Liability limitations (purchase price maximum)
- FR1.10: Force majeure clause
- FR1.11: Governing law and dispute resolution
- FR1.12: Modifications to terms provisions

### FR2: Privacy Policy Page

The system must provide a comprehensive Privacy Policy page covering all data protection aspects.

**Sub-requirements:**
- FR2.1: Data controller information and contact details
- FR2.2: Types of personal data collected (with examples)
- FR2.3: Legal basis for processing (GDPR compliance)
- FR2.4: Purpose of data processing
- FR2.5: Data sharing and third-party disclosures
- FR2.6: Data retention periods (photos: 30-90 days, orders: 7 years)
- FR2.7: Cookies and tracking technologies
- FR2.8: User rights (access, rectification, erasure, etc.)
- FR2.9: Security measures
- FR2.10: Children's privacy (age restrictions, parental consent)
- FR2.11: AI and photo usage policies
- FR2.12: International data transfers
- FR2.13: Marketing communications
- FR2.14: Policy updates and notifications

### FR3: Multilingual Support

Both legal pages must support translation into all supported languages.

**Sub-requirements:**
- FR3.1: Store translations for each page in JSON files within `locales/` directory
- FR3.2: Professional legal translation for all languages
- FR3.3: RTL layout support for Hebrew
- FR3.4: Language switcher integration
- FR3.5: Fallback to English if translation unavailable
- FR3.6: Cultural adaptation while maintaining legal precision

### FR4: Navigation Integration

The pages must be accessible through clear navigation paths.

**Sub-requirements:**
- FR4.1: Add "Terms of Service" and "Privacy Policy" links to footer
- FR4.2: Add legal links to checkout flow (required by law in some jurisdictions)
- FR4.3: Breadcrumb navigation for legal pages
- FR4.4: Cross-linking between Terms and Privacy Policy
- FR4.5: Mobile-responsive navigation

### FR5: SEO and Accessibility

The pages must be optimized for search engines and accessibility.

**Sub-requirements:**
- FR5.1: Unique meta titles and descriptions
- FR5.2: Clean, semantic URLs (`/[locale]/terms`, `/[locale]/privacy`)
- FR5.3: WCAG 2.1 AA compliance
- FR5.4: Print-friendly view option
- FR5.5: Schema.org structured data (Organization, WebPage)
- FR5.6: Canonical URLs for multilingual versions

### FR6: Interactive Features

The pages should include user-friendly interactive elements.

**Sub-requirements:**
- FR6.1: Collapsible sections for better readability
- FR6.2: Table of contents with anchor links
- FR6.3: "Last updated" timestamp
- FR6.4: Search functionality within legal pages
- FR6.5: Font size adjustment for accessibility
- FR6.6: "Download as PDF" option

---

## Non-Goals (Out of Scope)

1. **Admin CMS:** No admin interface for managing legal content. Content is managed directly in code/JSON files with legal review.

2. **Electronic Signatures:** No I Agree checkbox or signature collection (acceptance by use is sufficient).

3. **Legal Chatbot:** No AI-powered legal assistance or Q&A.

4. **Dynamic Policy Generation:** No personalized policies based on user location or preferences.

5. **Legal Document Storage:** No user-specific legal document storage or retrieval.

6. **Compliance Reporting:** No automated compliance reporting or audit trails.

7. **Multi-Jurisdiction Variations:** Single global policy (no location-specific variations beyond translation).

8. **Legal Consultation Features:** No integration with legal services or consultation booking.

---

## Design Considerations

### UI/UX Requirements

**Layout Pattern:** Clean, readable legal document layout
- Clear typography hierarchy
- Generous whitespace for comfortable reading
- Section-based organization with clear headings
- Sticky table of contents for long pages
- Print-friendly styling

**Visual Design:**
- Consistent with existing brand guidelines
- Professional, trustworthy appearance
- High contrast for readability
- Minimal decorative elements
- Focus on clarity over aesthetics

**Accessibility:**
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast ratios
- Semantic HTML structure
- ARIA labels where needed
- Focus indicators

**Mobile Optimization:**
- Readable font sizes (minimum 16px)
- Touch-friendly navigation
- Collapsible sections for small screens
- Fast loading on mobile networks
- Simplified table of contents

### Content Structure

**Terms of Service Sections:**
```
1. Introduction & Scope
2. Account Terms & Eligibility
3. Ordering Process & Acceptance
4. Pricing & Payment Terms
5. Cancellation & Refund Policy
6. Delivery & Shipping
7. Intellectual Property Rights
8. User Content & Responsibilities
9. AI-Generated Content Terms
10. Liability & Warranty Disclaimers
11. Indemnification
12. Force Majeure
13. Governing Law & Dispute Resolution
14. Modifications to Terms
15. Contact Information
```

**Privacy Policy Sections:**
```
1. Introduction & Data Controller
2. Data We Collect
3. How We Use Your Data
4. Legal Basis for Processing
5. Data Sharing & Third Parties
6. Data Retention
7. Your Rights (GDPR/CCPA)
8. Cookies & Tracking
9. Security Measures
10. Children's Privacy
11. AI & Photo Usage
12. International Transfers
13. Marketing Communications
14. Policy Updates
15. Contact Information
```

### Wireframe References

**Desktop Layout:**
```
+--------------------------------------------------+
| Logo | Navigation | Language Selector | Legal   |
+--------------------------------------------------+
| Home > Legal > Terms of Service                  |
+--------------------------------------------------+
|                                                  |
| [Table of Contents]                             |
| 1. Introduction                                 |
| 2. Account Terms                                |
| 3. Ordering Process                             |
| ...                                              |
|                                                  |
| # 1. Introduction & Scope                       |
|                                                  |
| These Terms of Service govern your use of...    |
|                                                  |
| # 2. Account Terms & Eligibility                |
|                                                  |
| To use our service, you must be...              |
|                                                  |
| [Print] [Download PDF]                          |
+--------------------------------------------------+
```

**Mobile Layout:**
```
+----------------------+
| ☰ | Legal | 🌐        |
+----------------------+
| Terms of Service     |
+----------------------+
| [☰] Contents         |
| - Introduction       |
| - Account Terms      |
| - Ordering           |
| - ...                |
+----------------------+
| # 1. Introduction    |
|                      |
| These Terms govern...|
|                      |
| ▼ 2. Account Terms   |
|                      |
| [Print] [PDF]        |
+----------------------+
```

---

## Technical Considerations

### Data Structure

**Terms JSON Structure:**
```typescript
// locales/en/terms.json
{
  "meta": {
    "title": "Terms of Service",
    "lastUpdated": "2026-01-27",
    "version": "1.0"
  },
  "sections": [
    {
      "id": "introduction",
      "title": "Introduction & Scope",
      "content": "These Terms of Service govern...",
      "subsections": [
        {
          "id": "acceptance",
          "title": "Acceptance of Terms",
          "content": "By using our service..."
        }
      ]
    }
  ]
}
```

**Privacy JSON Structure:**
```typescript
// locales/en/privacy.json
{
  "meta": {
    "title": "Privacy Policy",
    "lastUpdated": "2026-01-27",
    "version": "1.0"
  },
  "sections": [
    {
      "id": "introduction",
      "title": "Introduction & Data Controller",
      "content": "KidBook Creator ('we', 'us', 'our')...",
      "dataTypes": [
        {
          "type": "Personal Information",
          "examples": ["Name", "Email", "Shipping address"],
          "required": true
        }
      ]
    }
  ]
}
```

### File Structure
```
app/
  [locale]/
    terms/
      page.tsx              # Terms of Service page
    privacy/
      page.tsx              # Privacy Policy page

components/
  Legal/
    LegalPage.tsx           # Base legal page component
    TableOfContents.tsx     # Navigation component
    LegalSection.tsx        # Section component
    PrintableVersion.tsx    # Print-friendly view
    index.ts

locales/
  en/
    terms.json              # English Terms content
    privacy.json            # English Privacy content
  he/
    terms.json              # Hebrew Terms content
    privacy.json            # Hebrew Privacy content
  de/
    terms.json              # German Terms content
    privacy.json            # German Privacy content

lib/
  legal/
    types.ts                # TypeScript types
    utils.ts                # Helper functions
    constants.ts            # Legal constants
```

### Dependencies

**No New Dependencies Required:**
- Use existing Next.js (app router)
- Use existing React and TypeScript
- Use existing i18n system
- Use existing CSS Modules for styling
- Use existing PDF generation library (if needed)

### Performance Targets

- Page load time: < 2 seconds
- Time to Interactive: < 3 seconds
- Lighthouse Performance Score: > 90
- Core Web Vitals: Pass all metrics
- Search functionality: < 300ms response

### Security Considerations

- **Content Integrity:** Legal content served from static files, no database queries
- **XSS Prevention:** Use React's built-in escaping for dynamic content
- **Version Control:** All changes tracked through Git
- **Access Control:** No admin interfaces to secure
- **HTTPS Only:** Legal pages served over HTTPS only

---

## Success Metrics

### Primary Metrics

1. **Legal Page Views**
   - Target: Track baseline usage
   - Measurement: Page views on `/[locale]/terms` and `/[locale]/privacy`
   - Tracking: Google Analytics

2. **Checkout Completion Rate**
   - Target: 10% increase after legal pages launch
   - Measurement: Compare conversion funnel before/after
   - Tracking: Users who view legal pages during checkout

3. **Multilingual Adoption**
   - Target: 40% of non-English visitors use translated legal pages
   - Measurement: Legal page views by locale / Total non-English visitors
   - Tracking: Locale in URL path

### Secondary Metrics

4. **Page Performance**
   - Target: < 2 second page load time
   - Measurement: Google Analytics page load time
   - Tracking: Core Web Vitals

5. **Print/PDF Downloads**
   - Target: 5% of legal page visitors download/print
   - Measurement: Download and print events
   - Tracking: Custom event tracking

6. **Mobile Usage**
   - Target: 45% of legal page views on mobile devices
   - Measurement: Mobile vs. desktop page views
   - Tracking: Device type in analytics

---

## Content Requirements

### Terms of Service Key Points

**Critical Legal Clauses:**
1. **Personalized Product Exclusion:** Clear reference to EU Directive Article 16(c)
2. **Cancellation Window:** 48 hours before AI generation begins
3. **Defect Policy:** 14-day reporting window with photographic evidence
4. **AI Disclaimer:** "AI may lead to unexpected or imperfect results"
5. **Liability Cap:** Maximum liability limited to purchase price
6. **User Content:** User warrants no IP infringement, indemnifies company
7. **Jurisdiction:** Specify governing law for international operations

### Privacy Policy Key Points

**GDPR/CCPA Compliance:**
1. **Data Types:** Clear list of collected data with examples
2. **Legal Basis:** Performance of contract, legitimate interest, consent
3. **User Rights:** All 8 GDPR rights clearly explained
4. **Data Retention:** Photos (30-90 days), orders (7 years), communications (2 years)
5. **AI Usage:** Photos used only for illustration generation, not training
6. **Children's Data:** Service for adults, no collection from children under 16
7. **International Transfers:** Standard Contractual Clauses for non-EA transfers

### Translation Requirements

**Professional Legal Translation Needed For:**
- All Terms of Service content (legal precision critical)
- All Privacy Policy content (compliance critical)
- Headers, navigation, and UI elements
- Error messages and notifications

**Cultural Adaptation:**
- Legal concepts explained appropriately for each culture
- Examples and scenarios relevant to each market
- Tone adjusted while maintaining legal precision
- Local legal references where applicable

---

## Implementation Phases

### Phase 1: Content Development (Weeks 1-2)
- Draft English Terms of Service based on competitor analysis
- Draft English Privacy Policy with GDPR/CCPA compliance
- Legal review by qualified attorney
- Create JSON structure for translations
- Define section structure and navigation

### Phase 2: Technical Implementation (Weeks 3-4)
- Create legal page components and layouts
- Implement table of contents and navigation
- Add print-friendly and PDF download features
- Create responsive design for mobile/desktop
- Implement search functionality
- SEO optimization and meta tags

### Phase 3: Translation & Internationalization (Weeks 5-6)
- Professional legal translation to Hebrew and German
- RTL layout support for Hebrew
- Language switcher integration
- Test all translations for accuracy
- Cultural adaptation review
- Cross-browser and device testing

### Phase 4: Integration & Launch (Week 7)
- Add legal links to footer and checkout
- Update navigation components
- Final accessibility testing
- Performance optimization
- Deploy to production
- Monitor analytics and user feedback

---

## Risk Mitigation

### Legal Risks

1. **Non-Compliance:** Mitigate through professional legal review and regular updates
2. **Translation Errors:** Use professional legal translators, not machine translation
3. **Jurisdiction Issues:** Clear governing law clause, consult international legal expert
4. **IP Infringement:** Clear user content responsibilities and indemnification clauses

### Technical Risks

1. **Content Accuracy:** Version control with Git, approval workflow for changes
2. **Performance:** Static generation, CDN caching, image optimization
3. **Accessibility:** WCAG 2.1 AA testing, automated and manual testing
4. **Security:** No admin interfaces, static content serving, HTTPS only

### Business Risks

1. **User Trust:** Transparent language, clear policies, easy navigation
2. **Conversion Impact:** A/B test policy placement, minimize friction
3. **Maintenance Costs:** Simple structure, minimal updates required
4. **International Expansion:** Scalable translation system, flexible legal framework

---

## Open Questions

1. **Governing Law:** Which jurisdiction should govern the terms? (Recommendation: Ireland for EU-friendly laws, or Delaware for US business-friendly laws)

2. **Dispute Resolution:** Should we include arbitration clause? (Recommendation: Yes, to reduce litigation costs)

3. **Age Verification:** How do we verify user age for compliance? (Recommendation: Self-attestation during account creation)

4. **Data Processing Agreements:** Should we publish our DPAs with third parties? (Recommendation: No, maintain confidentiality)

5. **Policy Update Frequency:** How often should we review and update policies? (Recommendation: Quarterly review, immediate updates for legal changes)

6. **Legal Contact:** Should we provide a specific legal contact email? (Recommendation: Yes, separate from general support)

7. **Cookie Categories:** How detailed should our cookie policy be? (Recommendation: Follow IAB TCF v2.0 standard)

8. **Accessibility Statement:** Should we have a separate accessibility statement? (Recommendation: Yes, as part of commitment to inclusion)

---

## Related Documentation

- `11-LEGAL-POLICIES-COMPARISON.md` - Comprehensive competitor legal analysis
- `12-TERMS-CONDITIONS-COMPETITORS.md` - Detailed terms comparison
- `13-PRIVACY-POLICY-COMPETITORS.md` - Privacy policy analysis
- Brand Guidelines - For tone, voice, and visual identity
- `README-INTERNATIONALIZATION.md` - Translation system overview
- `README-COMPONENT-TRANSLATION.md` - Translation implementation guide

---

## Timeline & Priorities

### Phase 1: Critical Path (Weeks 1-2)
- [ ] Draft English legal content
- [ ] Legal review and approval
- [ ] Create JSON structure
- [ ] Define technical requirements

### Phase 2: MVP Implementation (Weeks 3-4)
- [ ] Create page components
- [ ] Implement navigation and search
- [ ] Add responsive design
- [ ] SEO optimization

### Phase 3: International Launch (Weeks 5-6)
- [ ] Professional translations
- [ ] RTL support implementation
- [ ] Language integration testing
- [ ] Cross-cultural review

### Phase 4: Production Launch (Week 7)
- [ ] Navigation integration
- [ ] Final testing and optimization
- [ ] Production deployment
- [ ] Analytics setup

---

## Notes

- **Legal Precision:** These are legally binding documents. All content must be reviewed by qualified legal counsel before publication.

- **Translation Quality:** Legal translation requires specialized expertise. Machine translation is not acceptable for legal content.

- **Maintenance:** Legal pages require regular updates as laws change and business evolves. Establish a quarterly review process.

- **User Experience:** While legal precision is critical, pages should still be user-friendly. Use clear headings, collapsible sections, and search functionality.

- **International Considerations:** Different jurisdictions have different requirements. Ensure compliance across all target markets.

- **Competitive Advantage:** Consider using clear, user-friendly policies as a competitive differentiator, similar to Hooray Heroes' free returns policy.

---

**Document Version:** 1.0  
**Last Updated:** January 27, 2026  
**Author:** Product Team  
**Status:** Ready for Legal Review  
**Next Review:** February 3, 2026
