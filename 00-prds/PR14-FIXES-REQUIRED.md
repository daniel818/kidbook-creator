# PR #14 Required Fixes - Comprehensive Document

**Date:** January 29, 2026  
**PR:** #14 - feat: Add Pricing Page with i18n Support  
**Status:** Open - Requires Major Revisions Before Merge  
**Priority:** High

---

## Executive Summary

PR #14 introduces pricing, FAQ, terms, privacy, about, and footer components with internationalization support. However, the PR contains **120+ files** with significant issues including:
- Premature features not yet implemented in the product
- Duplicate files with "2" suffix causing broken imports
- Content misalignment with current product capabilities
- Hydration errors
- Redundant code and components
- References to non-existent features (newsletter, community, multi-book discounts, image editing)

This document consolidates all required changes based on user feedback, screenshot analysis, automated reviews, and code inspection.

---

## 1. PRICING PAGE FIXES

### 1.1 Remove Multi-Book Pricing & Discounts
**Issue:** Pricing page shows multiple book packages (Single, Double, Triple) with volume discounts. We currently only offer ONE book at a time.

**Files to Update:**
- `locales/en/pricing.json`
- `locales/he/pricing.json`
- `locales/de/pricing.json`
- `components/PricingMatrix/PricingMatrix.tsx`
- `app/[locale]/pricing/page.tsx`

**Required Changes:**
- Remove all references to "Double" (2 books), "Triple" (3 books), "4+ books"
- Remove discount tiers: "2-3 Books: 15% off", "4+ Books: 20% off"
- Remove "Free Shipping on 2+ books" messaging
- Simplify to show only:
  - **One Digital Copy** (PDF format, instant download)
  - **One Printed Copy** (includes digital copy)
- Update pricing matrix to show single book options only
- Remove "Best Value" badges on multi-book packages

**Translation Keys to Remove/Update:**
```json
// REMOVE these keys:
"matrix.double"
"matrix.triple"
"matrix.books" (plural)
"faq.q2" (about ordering more than 3 books)
"Multi-Book Discounts" section
```

---

## 2. NEWSLETTER REMOVAL

### 2.1 Remove Newsletter Signup
**Issue:** We do not have a newsletter system yet. Remove all newsletter signup forms and references.

**Files to Update:**
- `components/Footer/Footer.tsx`
- `components/Footer/components/NewsletterForm/NewsletterForm.tsx`
- `locales/en/footer.json`
- `locales/he/footer.json`
- `locales/de/footer.json`
- `locales/en/faq.json`
- `locales/he/faq.json`
- `locales/de/faq.json`

**Required Changes:**
- Remove `<NewsletterForm />` component from Footer
- Remove newsletter section from footer translations
- Remove newsletter discount references from FAQ:
  - "Newsletter Signup: Exclusive discount on your first order"
  - "Sign up for our newsletter to be notified when new languages become available"
- Delete or comment out entire `NewsletterForm` component folder

**FAQ Updates:**
```json
// REMOVE from pricing-options FAQ:
"<li><strong>Newsletter Signup:</strong> Exclusive discount on your first order</li>"
```

---

## 3. FAQ PAGE FIXES

### 3.1 Remove Multi-Book Discount References
**Files:** `locales/en/faq.json`, `locales/he/faq.json`, `locales/de/faq.json`

**Remove from "pricing-options" FAQ:**
- Multi-Book Discounts section entirely
- Newsletter signup discount
- Referral program (not implemented)
- Seasonal sales (not implemented)

**Keep Only:**
- Single book pricing information
- Payment methods
- Currency information
- Shipping costs (calculated at checkout)

### 3.2 Remove Image Editing Capabilities
**Issue (Hebrew Screenshot #6):** FAQ mentions "אפשרויות איור" (illustration options) - we currently do NOT allow changes to generated images.

**Files:** All FAQ translation files

**Remove from "customize-story" FAQ:**
```json
// REMOVE these lines:
"<h4>Illustration Options:</h4>"
"<li>Request regeneration of specific illustrations if you're not satisfied</li>"
"<li>Choose from different art styles (depending on story theme)</li>"
```

**Update to:**
```json
"answer": "<p>Yes! We offer text customization options:</p><h4>Text Customization:</h4><ul><li>Edit any text in the story to personalize it further</li><li>Modify character names and details</li><li>Add or change the dedication message</li></ul><h4>Character Customization:</h4><ul><li>Child's name appears throughout the story</li><li>AI generates character based on uploaded photo</li><li>Consistent character appearance across all pages</li></ul><p><strong>Note:</strong> Once illustrations are generated, they cannot be changed. Please review carefully during the preview stage.</p>"
```

### 3.3 Remove Preview Before Order Section
**Issue (Hebrew Screenshot #7):** FAQ mentions "תצוגה מקדימה לפני הזמנה" (preview before order) - remove this entire section if it implies features we don't have.

**Action:** Review and ensure preview functionality accurately reflects current capabilities. If preview is not available, remove all references.

---

## 4. REMOVE "AI" TERMINOLOGY - USE MAGICAL LANGUAGE

### 4.1 Replace AI References with Story Creation Magic
**Issue (Screenshot #4, #5):** User wants to remove "AI" terminology and make the discussion more magical about how we create books with COMPANY NAME.

**Files to Update:**
- All FAQ files (en/he/de)
- About page translations
- Pricing page copy
- Terms and Privacy pages
- Any component with "AI" in user-facing text

**Replacements:**
| Current | Replace With |
|---------|-------------|
| "AI-generated" | "magically created" / "personalized" |
| "AI technology" | "our story creation technology" / "our platform" |
| "AI creates" | "we create" / "our system creates" |
| "How does the AI book creation process work?" | "How does the book creation process work?" |
| "AI-generated character" | "personalized character" / "custom character" |
| "AI uses this photo" | "we use this photo" |
| "AI quality" | "story quality" / "book quality" |
| "AI artistic interpretation" | "creative interpretation" / "artistic style" |

**Example FAQ Update:**
```
OLD: "How does the AI book creation process work?"
NEW: "How does the book creation process work with KidBook Creator?"

OLD: "Our AI uses this to create a consistent character"
NEW: "We use this to create a consistent character throughout your story"
```

---

## 5. ABOUT PAGE FIXES

### 5.1 Remove "What We Believe In" Section
**Issue (Screenshot #2):** The "What We Believe In" section is too tech-focused. Remove this entire section.

**Files to Update:**
- `components/ValuesGrid/ValuesGrid.tsx`
- `app/[locale]/about/page.tsx`
- `locales/en/about.json`
- `locales/he/about.json`
- `locales/de/about.json`

**Required Changes:**
- Remove `<ValuesGrid />` component from About page
- Remove values section from translations:
  - "Storytelling"
  - "Meaningful Learning"
  - "Innovation"
  - "Childlike Wonder"

### 5.2 Change "Community Books" to "Our Books"
**Issue (Screenshot #3, #4):** We don't have community books or a community feature yet.

**Files to Update:**
- `locales/en/footer.json`
- `locales/he/footer.json`
- `locales/de/footer.json`
- `locales/en/about.json`
- `locales/he/about.json`
- `locales/de/about.json`
- `components/Footer/Footer.tsx`

**Changes:**
```json
// OLD:
"community": "Community Books"
"secondary": "Explore Community Books"

// NEW:
"community": "Our Recommended Books"
"secondary": "Explore Our Books"
```

**Hebrew:**
```json
// OLD:
"community": "ספרי הקהילה"

// NEW:
"community": "הספרים המומלצים שלנו"
```

---

## 6. FOOTER FIXES

### 6.1 Remove Social Media Links
**Issue (Screenshot #10, #11):** Remove Facebook and Instagram links until we actually create these pages.

**Files to Update:**
- `components/Footer/Footer.tsx`
- `components/Footer/components/SocialLinks/SocialLinks.tsx`
- `locales/en/footer.json`
- `locales/he/footer.json`
- `locales/de/footer.json`

**Required Changes:**
- Remove `<SocialLinks />` component from Footer
- Remove social section from footer translations
- Remove Facebook and Instagram schema.org references from Footer.tsx:
```typescript
// REMOVE from schema.org:
sameAs: [
  'https://facebook.com/kidbookcreator',
  'https://instagram.com/kidbookcreator',
  'https://pinterest.com/kidbookcreator',
],
```

### 6.2 Update Footer Links
**Current Issues:**
- Newsletter section (remove)
- Social links (remove)
- Community Books link (update to "Our Recommended Books")

---

## 7. DELETE DUPLICATE FILES WITH "2" SUFFIX

### 7.1 Critical File Cleanup
**Issue (Screenshot #7, #8, AI Review):** 120 files added to PR, many are duplicates with " 2" suffix causing broken imports.

**Files to DELETE:**
```
components/LanguageSwitcher/LanguageSwitcher 2.tsx
components/LanguageSwitcher/LanguageSwitcher.module 2.css
components/LanguageSwitcher/index 2.ts
components/AlertModal/AlertModal 2.tsx
components/AlertModal/AlertModal.module 2.css
components/AlertModal/index 2.ts
lib/gemini/prompts/en 2.ts
lib/gemini/prompts/de 2.ts
lib/gemini/prompts/he 2.ts
lib/gemini/prompts/index 2.ts
supabase/migrations/20260124000000_add_language_to_books 2.sql
```

**Action Required:**
1. Delete ALL files with " 2" in the filename (excluding node_modules)
2. Verify imports are pointing to correct files without " 2" suffix
3. Run build to ensure no broken imports

**Command to find all " 2" files:**
```bash
find . -name "* 2.*" -not -path "*/node_modules/*" -type f
```

---

## 8. REMOVE TEAM PHOTOS COMPONENTS

### 8.1 Delete TeamPhotos Components
**Issue (Screenshot #7, #8):** TeamPhotos and TeamPhotos2 folders/components exist but we don't have team photos yet.

**Files/Folders to DELETE:**
```
components/TeamPhotos/
components/TeamPhotos2/
```

**Files to UPDATE:**
- `app/[locale]/about/page.tsx` - Remove imports and usage:
```typescript
// REMOVE:
import { TeamPhotos } from '@/components/TeamPhotos';
import { TeamPhotos2 } from '@/components/TeamPhotos2';

// REMOVE from JSX:
<TeamPhotos />
<TeamPhotos2 />
```

---

## 9. FIX HYDRATION ERROR

### 9.1 Resolve Silent Hydration Mismatch
**Issue (Screenshot #9):** Hydration error in AboutHero component.

**Error Details:**
```
Hydration failed because the server rendered text didn't match the client.
File: components/AboutHero/AboutHero.tsx (18:9)
```

**Root Cause Analysis:**
- Server/client branch mismatch (typeof window)
- Variable input (Date.now(), Math.random())
- Date formatting in user's locale
- External data without snapshot
- Invalid HTML tag nesting
- Browser extension interference

**Files to Review:**
- `components/AboutHero/AboutHero.tsx`
- `components/AboutHero/AboutHero.module.css`
- Any component using dynamic data on initial render

**Solution:**
1. Ensure all dynamic content uses `useEffect` for client-only rendering
2. Use `suppressHydrationWarning` only as last resort
3. Check for date/time formatting issues
4. Verify translation strings match between server/client

---

## 10. CODE QUALITY & TECHNICAL ISSUES

### 10.1 Type Safety Issues (From AI Review)
**Issue:** Use of `any` type in legal types reducing type safety.

**Files to Fix:**
- `lib/legal/types.ts`

**Current Problem:**
```typescript
interface LegalSectionData {
  [key: string]: any;  // ❌ Too permissive
}
```

**Fix:**
```typescript
interface LegalSectionData {
  id: string;
  title: string;
  content: string;
  subsections?: LegalSectionData[];
}
```

### 10.2 Security Issues (From AI Review)

#### XSS Risk in FAQ Highlighting
**File:** `lib/faq/utils.ts`

**Issue:** `highlightText` generates HTML markup that can lead to XSS.

**Current:**
```typescript
export function highlightText(text: string, query: string): string {
  return text.replace(new RegExp(query, 'gi'), '<mark>$&</mark>');
}
```

**Fix:** Use React component instead of raw HTML, or properly sanitize.

#### Middleware Locale Validation
**File:** `middleware.ts`

**Issue:** Middleware trusts `NEXT_LOCALE` cookie without validation.

**Fix:** Validate cookie value against allowed locales list:
```typescript
const allowedLocales = ['en', 'de', 'he'];
const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
const locale = allowedLocales.includes(cookieLocale) ? cookieLocale : defaultLocale;
```

### 10.3 SSR Safety
**File:** `lib/faq/utils.ts`

**Issue:** `scrollToFAQ` uses `document` directly (not SSR-safe).

**Fix:**
```typescript
export function scrollToFAQ(id: string): void {
  if (typeof window === 'undefined') return;
  const element = document.getElementById(id);
  // ... rest of code
}
```

---

## 11. REDUCE PR SCOPE & REDUNDANT CODE

### 11.1 Excessive File Count
**Issue (Screenshot #7, User Feedback #12):** PR adds 120 files which is excessive. Need to understand what's truly needed.

**Analysis Required:**
1. Review all 120 files in PR diff
2. Identify truly necessary vs. redundant files
3. Remove unused components
4. Consolidate duplicate functionality

**Files to Review for Removal:**
- Competitor analysis documents (should these be in PR?)
- Multiple PRD documents (consolidate?)
- Duplicate component variations
- Unused utility functions
- Over-engineered abstractions

### 11.2 Component Consolidation
**Potential Redundancies:**
- TeamPhotos vs TeamPhotos2 (DELETE both)
- Multiple footer sub-components (evaluate necessity)
- Legal page components (simplify if possible)

---

## 12. TRANSLATION CONSISTENCY

### 12.1 Ensure All Languages Match
**Issue:** Changes must be applied consistently across all three languages.

**Languages:**
- English (en)
- Hebrew (he)
- German (de)

**Files to Keep in Sync:**
```
locales/en/*.json
locales/he/*.json
locales/de/*.json
```

**Verification Checklist:**
- [ ] All removed features removed from all languages
- [ ] All terminology updates applied to all languages
- [ ] Hebrew RTL considerations maintained
- [ ] No orphaned translation keys

---

## 13. TESTING & VERIFICATION REQUIREMENTS

### 13.1 Pre-Merge Testing Checklist

**Build & Type Checking:**
- [ ] `npm run build` completes without errors
- [ ] `npm run type-check` passes
- [ ] No TypeScript errors in modified files

**Functionality Testing:**
- [ ] Pricing page displays only single book options
- [ ] FAQ page loads without errors
- [ ] About page renders correctly (without removed sections)
- [ ] Footer displays correctly (without newsletter/social)
- [ ] All "Coming Soon" alerts work for unimplemented features
- [ ] Language switching works across all pages
- [ ] No hydration errors in console

**Content Verification:**
- [ ] No "AI" terminology in user-facing text
- [ ] No multi-book discount references
- [ ] No newsletter signup forms
- [ ] No image editing capability mentions
- [ ] "Community Books" changed to "Our Recommended Books"
- [ ] Social media links removed

**Code Quality:**
- [ ] No files with " 2" suffix remain
- [ ] TeamPhotos components deleted
- [ ] Type safety issues resolved (no `any` types)
- [ ] Security issues fixed (XSS, cookie validation)
- [ ] SSR safety verified

**Translation Consistency:**
- [ ] English translations updated
- [ ] Hebrew translations updated
- [ ] German translations updated
- [ ] All three languages have matching content structure

---

## 14. IMPLEMENTATION PRIORITY

### Phase 1: Critical Fixes (Must Complete Before Merge)
1. Delete all " 2" suffix files
2. Remove TeamPhotos/TeamPhotos2 components
3. Fix hydration error
4. Remove newsletter functionality
5. Remove social media links
6. Fix security issues (XSS, cookie validation)

### Phase 2: Content Updates (Must Complete Before Merge)
1. Update pricing to single book only
2. Remove multi-book discounts from FAQ
3. Replace "AI" with magical language
4. Remove image editing references
5. Update "Community Books" to "Our Recommended Books"
6. Remove "What We Believe In" section

### Phase 3: Code Quality (Must Complete Before Merge)
1. Fix type safety issues
2. Ensure SSR safety
3. Remove redundant code
4. Consolidate components
5. Update all three language files consistently

### Phase 4: Testing & Verification (Before Final Approval)
1. Complete testing checklist
2. Verify build passes
3. Test all pages in all languages
4. Verify no console errors
5. Code review for remaining issues

---

## 15. FILES REQUIRING CHANGES - COMPLETE LIST

### Delete Entirely:
```
components/TeamPhotos/
components/TeamPhotos2/
components/Footer/components/NewsletterForm/
components/Footer/components/SocialLinks/
components/ValuesGrid/
components/LanguageSwitcher/LanguageSwitcher 2.tsx
components/LanguageSwitcher/LanguageSwitcher.module 2.css
components/LanguageSwitcher/index 2.ts
components/AlertModal/AlertModal 2.tsx
components/AlertModal/AlertModal.module 2.css
components/AlertModal/index 2.ts
lib/gemini/prompts/en 2.ts
lib/gemini/prompts/de 2.ts
lib/gemini/prompts/he 2.ts
lib/gemini/prompts/index 2.ts
supabase/migrations/20260124000000_add_language_to_books 2.sql
```

### Modify - Pricing:
```
locales/en/pricing.json
locales/he/pricing.json
locales/de/pricing.json
components/PricingMatrix/PricingMatrix.tsx
app/[locale]/pricing/page.tsx
```

### Modify - FAQ:
```
locales/en/faq.json
locales/he/faq.json
locales/de/faq.json
components/FAQ/FAQList.tsx
```

### Modify - About:
```
locales/en/about.json
locales/he/about.json
locales/de/about.json
app/[locale]/about/page.tsx
components/AboutHero/AboutHero.tsx (fix hydration)
```

### Modify - Footer:
```
locales/en/footer.json
locales/he/footer.json
locales/de/footer.json
components/Footer/Footer.tsx
```

### Modify - Security/Type Safety:
```
lib/legal/types.ts
lib/faq/utils.ts
middleware.ts
```

### Modify - Terms/Privacy:
```
locales/en/terms.json
locales/he/terms.json
locales/de/terms.json
locales/en/privacy.json
locales/he/privacy.json
locales/de/privacy.json
```

---

## 16. ADDITIONAL RECOMMENDATIONS

### 16.1 Consider Splitting PR
**Recommendation:** This PR is trying to do too much. Consider splitting into:
1. **PR #14a:** Core pricing page (single book only)
2. **PR #14b:** FAQ system
3. **PR #14c:** Terms & Privacy pages
4. **PR #14d:** About page (simplified)
5. **PR #14e:** Footer updates

### 16.2 Feature Flags
**Recommendation:** For future features (newsletter, community, multi-book), implement feature flags so code can exist but be disabled until ready.

### 16.3 Documentation
**Recommendation:** Create a FEATURES.md document tracking:
- Implemented features
- Coming soon features
- Features to avoid mentioning in UI

---

## 17. APPROVAL CRITERIA

PR #14 can be approved for merge when:

1. ✅ All " 2" suffix files deleted
2. ✅ TeamPhotos components removed
3. ✅ Hydration error resolved
4. ✅ Newsletter functionality removed
5. ✅ Social media links removed
6. ✅ Pricing shows single book only
7. ✅ Multi-book discounts removed from FAQ
8. ✅ "AI" replaced with magical language
9. ✅ Image editing references removed
10. ✅ "Community Books" → "Our Recommended Books"
11. ✅ "What We Believe In" section removed
12. ✅ Security issues fixed (XSS, cookie validation)
13. ✅ Type safety issues resolved
14. ✅ All three languages updated consistently
15. ✅ Build passes without errors
16. ✅ No console errors during testing
17. ✅ All functionality tested in all languages

---

## 18. CONTACT & QUESTIONS

For questions about these requirements, contact the product owner or refer to:
- Original feedback screenshots
- User requirements document
- AI review comments on PR #14

---

**Document Version:** 1.0  
**Last Updated:** January 29, 2026  
**Next Review:** After implementation of Phase 1 fixes

---

## 19. RELEVANT FILES

### Files to DELETE:
- `components/TeamPhotos/TeamPhotos.tsx` - Unused component, no team photos available
- `components/TeamPhotos/TeamPhotos.module.css` - Styles for deleted component
- `components/TeamPhotos/index.ts` - Barrel export for deleted component
- `components/TeamPhotos2/TeamPhotos2.tsx` - Duplicate unused component
- `components/TeamPhotos2/TeamPhotos2.module.css` - Styles for deleted component
- `components/TeamPhotos2/index.ts` - Barrel export for deleted component
- `components/ValuesGrid/ValuesGrid.tsx` - "What We Believe In" section to be removed
- `components/ValuesGrid/ValuesGrid.module.css` - Styles for deleted component
- `components/ValuesGrid/index.ts` - Barrel export for deleted component
- `components/Footer/components/NewsletterForm/NewsletterForm.tsx` - Newsletter not implemented
- `components/Footer/components/NewsletterForm/NewsletterForm.module.css` - Styles for deleted component
- `components/Footer/components/NewsletterForm/index.ts` - Barrel export for deleted component
- `components/Footer/components/SocialLinks/SocialLinks.tsx` - Social media not ready
- `components/Footer/components/SocialLinks/SocialLinks.module.css` - Styles for deleted component
- `components/Footer/components/SocialLinks/index.ts` - Barrel export for deleted component
- `components/LanguageSwitcher/LanguageSwitcher 2.tsx` - Duplicate file with "2" suffix
- `components/LanguageSwitcher/LanguageSwitcher.module 2.css` - Duplicate file with "2" suffix
- `components/LanguageSwitcher/index 2.ts` - Duplicate file with "2" suffix
- `components/AlertModal/AlertModal 2.tsx` - Duplicate file with "2" suffix
- `components/AlertModal/AlertModal.module 2.css` - Duplicate file with "2" suffix
- `components/AlertModal/index 2.ts` - Duplicate file with "2" suffix
- `lib/gemini/prompts/en 2.ts` - Duplicate file with "2" suffix
- `lib/gemini/prompts/de 2.ts` - Duplicate file with "2" suffix
- `lib/gemini/prompts/he 2.ts` - Duplicate file with "2" suffix
- `lib/gemini/prompts/index 2.ts` - Duplicate file with "2" suffix
- `supabase/migrations/20260124000000_add_language_to_books 2.sql` - Duplicate migration file

### Files to MODIFY - Pricing:
- `locales/en/pricing.json` - Remove multi-book pricing, update to single book only
- `locales/he/pricing.json` - Remove multi-book pricing, update to single book only
- `locales/de/pricing.json` - Remove multi-book pricing, update to single book only
- `components/PricingMatrix/PricingMatrix.tsx` - Update component to show single book options only
- `app/[locale]/pricing/page.tsx` - Update page to reflect single book pricing

### Files to MODIFY - FAQ:
- `locales/en/faq.json` - Remove multi-book discounts, newsletter, image editing, replace AI terminology
- `locales/he/faq.json` - Remove multi-book discounts, newsletter, image editing, replace AI terminology
- `locales/de/faq.json` - Remove multi-book discounts, newsletter, image editing, replace AI terminology
- `components/FAQ/FAQList.tsx` - Verify component works with updated content
- `lib/faq/utils.ts` - Fix XSS risk in highlightText, fix SSR safety in scrollToFAQ

### Files to MODIFY - About:
- `locales/en/about.json` - Remove values section, update community references
- `locales/he/about.json` - Remove values section, update community references
- `locales/de/about.json` - Remove values section, update community references
- `app/[locale]/about/page.tsx` - Remove TeamPhotos, TeamPhotos2, ValuesGrid imports and usage
- `components/AboutHero/AboutHero.tsx` - Fix hydration error

### Files to MODIFY - Footer:
- `locales/en/footer.json` - Remove newsletter, social sections, update community to "Our Recommended Books"
- `locales/he/footer.json` - Remove newsletter, social sections, update community to "Our Recommended Books"
- `locales/de/footer.json` - Remove newsletter, social sections, update community to "Our Recommended Books"
- `components/Footer/Footer.tsx` - Remove NewsletterForm, SocialLinks components, update schema.org

### Files to MODIFY - Security/Type Safety:
- `lib/legal/types.ts` - Replace `any` types with proper TypeScript interfaces
- `middleware.ts` - Add locale cookie validation against allowed locales list

### Files to MODIFY - Terms/Privacy:
- `locales/en/terms.json` - Replace AI terminology with magical language
- `locales/he/terms.json` - Replace AI terminology with magical language
- `locales/de/terms.json` - Replace AI terminology with magical language
- `locales/en/privacy.json` - Replace AI terminology with magical language
- `locales/he/privacy.json` - Replace AI terminology with magical language
- `locales/de/privacy.json` - Replace AI terminology with magical language

### Notes
- All file deletions should be verified to ensure no broken imports remain
- After deletions, run `npm run build` to verify no compilation errors
- Use `find . -name "* 2.*" -not -path "*/node_modules/*" -type f` to locate all duplicate files
- Translation files must be updated consistently across all three languages (en/he/de)
- Test all pages in all three languages after changes

---

## 20. IMPLEMENTATION TASKS

### PHASE 1: Critical Cleanup & File Deletion (Priority: CRITICAL)

- [ ] 1.0 Delete All Duplicate Files with "2" Suffix
  - [ ] 1.1 Run command to find all files: `find . -name "* 2.*" -not -path "*/node_modules/*" -type f`
  - [ ] 1.2 Delete `components/LanguageSwitcher/LanguageSwitcher 2.tsx`
  - [ ] 1.3 Delete `components/LanguageSwitcher/LanguageSwitcher.module 2.css`
  - [ ] 1.4 Delete `components/LanguageSwitcher/index 2.ts`
  - [ ] 1.5 Delete `components/AlertModal/AlertModal 2.tsx`
  - [ ] 1.6 Delete `components/AlertModal/AlertModal.module 2.css`
  - [ ] 1.7 Delete `components/AlertModal/index 2.ts`
  - [ ] 1.8 Delete `lib/gemini/prompts/en 2.ts`
  - [ ] 1.9 Delete `lib/gemini/prompts/de 2.ts`
  - [ ] 1.10 Delete `lib/gemini/prompts/he 2.ts`
  - [ ] 1.11 Delete `lib/gemini/prompts/index 2.ts`
  - [ ] 1.12 Delete `supabase/migrations/20260124000000_add_language_to_books 2.sql`
  - [ ] 1.13 Verify no other "2" suffix files exist (excluding node_modules)
  - [ ] 1.14 Run `npm run build` to check for broken imports
  - [ ] 1.15 Fix any broken import statements found

- [ ] 2.0 Remove TeamPhotos Components
  - [ ] 2.1 Delete entire `components/TeamPhotos/` directory
  - [ ] 2.2 Delete entire `components/TeamPhotos2/` directory
  - [ ] 2.3 Open `app/[locale]/about/page.tsx`
  - [ ] 2.4 Remove import: `import { TeamPhotos } from '@/components/TeamPhotos';`
  - [ ] 2.5 Remove import: `import { TeamPhotos2 } from '@/components/TeamPhotos2';`
  - [ ] 2.6 Remove `<TeamPhotos />` from JSX
  - [ ] 2.7 Remove `<TeamPhotos2 />` from JSX
  - [ ] 2.8 Verify about page still renders correctly
  - [ ] 2.9 Test about page in all three languages (en/he/de)

- [ ] 3.0 Remove ValuesGrid Component ("What We Believe In")
  - [ ] 3.1 Delete entire `components/ValuesGrid/` directory
  - [ ] 3.2 Open `app/[locale]/about/page.tsx`
  - [ ] 3.3 Remove import: `import { ValuesGrid } from '@/components/ValuesGrid';`
  - [ ] 3.4 Remove `<ValuesGrid />` from JSX
  - [ ] 3.5 Open `locales/en/about.json`
  - [ ] 3.6 Remove entire `values` section from JSON
  - [ ] 3.7 Open `locales/he/about.json`
  - [ ] 3.8 Remove entire `values` section from JSON
  - [ ] 3.9 Open `locales/de/about.json`
  - [ ] 3.10 Remove entire `values` section from JSON
  - [ ] 3.11 Test about page renders without values section

- [ ] 4.0 Remove Newsletter Functionality
  - [ ] 4.1 Delete entire `components/Footer/components/NewsletterForm/` directory
  - [ ] 4.2 Open `components/Footer/Footer.tsx`
  - [ ] 4.3 Remove import: `import NewsletterForm from './components/NewsletterForm';`
  - [ ] 4.4 Remove `<NewsletterForm />` from JSX (inside newsletterSection div)
  - [ ] 4.5 Open `locales/en/footer.json`
  - [ ] 4.6 Remove entire `newsletter` section from `sections` object
  - [ ] 4.7 Open `locales/he/footer.json`
  - [ ] 4.8 Remove entire `newsletter` section from `sections` object
  - [ ] 4.9 Open `locales/de/footer.json`
  - [ ] 4.10 Remove entire `newsletter` section from `sections` object
  - [ ] 4.11 Test footer renders correctly without newsletter

- [ ] 5.0 Remove Social Media Links
  - [ ] 5.1 Delete entire `components/Footer/components/SocialLinks/` directory
  - [ ] 5.2 Open `components/Footer/Footer.tsx`
  - [ ] 5.3 Remove import: `import SocialLinks from './components/SocialLinks';`
  - [ ] 5.4 Remove `<SocialLinks />` from JSX
  - [ ] 5.5 Remove schema.org `sameAs` array with Facebook/Instagram/Pinterest URLs
  - [ ] 5.6 Open `locales/en/footer.json`
  - [ ] 5.7 Remove entire `social` section from `sections` object
  - [ ] 5.8 Open `locales/he/footer.json`
  - [ ] 5.9 Remove entire `social` section from `sections` object
  - [ ] 5.10 Open `locales/de/footer.json`
  - [ ] 5.11 Remove entire `social` section from `sections` object
  - [ ] 5.12 Test footer renders correctly without social links

- [ ] 6.0 Fix Critical Security Issues
  - [ ] 6.1 Open `middleware.ts`
  - [ ] 6.2 Add allowed locales constant: `const allowedLocales = ['en', 'de', 'he'];`
  - [ ] 6.3 Get cookie locale: `const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;`
  - [ ] 6.4 Validate locale: `const locale = allowedLocales.includes(cookieLocale) ? cookieLocale : defaultLocale;`
  - [ ] 6.5 Update redirect to use validated locale
  - [ ] 6.6 Open `lib/faq/utils.ts`
  - [ ] 6.7 Update `scrollToFAQ` function to check `typeof window === 'undefined'` before accessing document
  - [ ] 6.8 Update `highlightText` to use React component instead of raw HTML or properly sanitize
  - [ ] 6.9 Open `lib/legal/types.ts`
  - [ ] 6.10 Replace `[key: string]: any;` with proper typed interface
  - [ ] 6.11 Define specific properties: `id: string; title: string; content: string; subsections?: LegalSectionData[];`
  - [ ] 6.12 Run TypeScript check: `npm run type-check`

### PHASE 2: Content Updates - Pricing (Priority: HIGH)

- [ ] 7.0 Update Pricing Translations - English
  - [ ] 7.1 Open `locales/en/pricing.json`
  - [ ] 7.2 Remove `matrix.double` key
  - [ ] 7.3 Remove `matrix.triple` key
  - [ ] 7.4 Remove `matrix.books` key (plural)
  - [ ] 7.5 Update `matrix.single` to just show "1 book"
  - [ ] 7.6 Remove `matrix.bestValue` key
  - [ ] 7.7 Remove FAQ question `faq.q2` about ordering more than 3 books
  - [ ] 7.8 Update `faq.a1` to remove multi-book shipping references
  - [ ] 7.9 Save file and verify JSON is valid

- [ ] 8.0 Update Pricing Translations - Hebrew
  - [ ] 8.1 Open `locales/he/pricing.json`
  - [ ] 8.2 Remove `matrix.double` key (כפול)
  - [ ] 8.3 Remove `matrix.triple` key (משולש)
  - [ ] 8.4 Remove `matrix.books` key (ספרים)
  - [ ] 8.5 Update to show single book only
  - [ ] 8.6 Remove multi-book discount FAQ entries
  - [ ] 8.7 Save file and verify JSON is valid

- [ ] 9.0 Update Pricing Translations - German
  - [ ] 9.1 Open `locales/de/pricing.json`
  - [ ] 9.2 Remove `matrix.double` key
  - [ ] 9.3 Remove `matrix.triple` key
  - [ ] 9.4 Remove `matrix.books` key
  - [ ] 9.5 Update to show single book only
  - [ ] 9.6 Remove multi-book discount FAQ entries
  - [ ] 9.7 Save file and verify JSON is valid

- [ ] 10.0 Update PricingMatrix Component
  - [ ] 10.1 Open `components/PricingMatrix/PricingMatrix.tsx`
  - [ ] 10.2 Remove all code related to "double" package rendering
  - [ ] 10.3 Remove all code related to "triple" package rendering
  - [ ] 10.4 Remove discount calculation logic
  - [ ] 10.5 Simplify to show only Digital and Printed options for single book
  - [ ] 10.6 Remove "Best Value" badge logic
  - [ ] 10.7 Update pricing display to show single book prices only
  - [ ] 10.8 Test component renders correctly with updated translations

- [ ] 11.0 Update Pricing Page
  - [ ] 11.1 Open `app/[locale]/pricing/page.tsx`
  - [ ] 11.2 Review hardcoded text for multi-book references
  - [ ] 11.3 Update any hardcoded descriptions to reflect single book offering
  - [ ] 11.4 Test page in all three languages
  - [ ] 11.5 Verify pricing matrix displays correctly

### PHASE 3: Content Updates - FAQ (Priority: HIGH)

- [ ] 12.0 Update FAQ - Remove Multi-Book Discounts (English)
  - [ ] 12.1 Open `locales/en/faq.json`
  - [ ] 12.2 Find "pricing-options" FAQ answer
  - [ ] 12.3 Remove entire "Multi-Book Discounts" section with 2-3 books, 4+ books discounts
  - [ ] 12.4 Remove "Free Shipping: Automatically applied on orders of 2+ books"
  - [ ] 12.5 Remove "Newsletter Signup: Exclusive discount on your first order"
  - [ ] 12.6 Remove "Seasonal Sales: 15-20% off during major holidays"
  - [ ] 12.7 Remove "Referral Program: Earn credit for each friend who orders"
  - [ ] 12.8 Keep only: Single Book Pricing, Payment Methods, Currency & Pricing sections
  - [ ] 12.9 Save and verify JSON validity

- [ ] 13.0 Update FAQ - Remove Image Editing References (English)
  - [ ] 13.1 Open `locales/en/faq.json`
  - [ ] 13.2 Find "customize-story" FAQ answer
  - [ ] 13.3 Remove entire "Illustration Options" section
  - [ ] 13.4 Remove "Request regeneration of specific illustrations if you're not satisfied"
  - [ ] 13.5 Remove "Choose from different art styles (depending on story theme)"
  - [ ] 13.6 Add note: "Once illustrations are generated, they cannot be changed. Please review carefully during preview."
  - [ ] 13.7 Save and verify JSON validity

- [ ] 14.0 Update FAQ - Replace AI Terminology (English)
  - [ ] 14.1 Open `locales/en/faq.json`
  - [ ] 14.2 Replace "How does the AI book creation process work?" with "How does the book creation process work?"
  - [ ] 14.3 Replace "AI-generated" with "personalized" or "magically created"
  - [ ] 14.4 Replace "AI technology" with "our story creation technology"
  - [ ] 14.5 Replace "AI creates" with "we create" or "our system creates"
  - [ ] 14.6 Replace "AI uses this photo" with "we use this photo"
  - [ ] 14.7 Replace "AI quality" with "story quality" or "book quality"
  - [ ] 14.8 Replace "AI artistic interpretation" with "creative interpretation"
  - [ ] 14.9 Review all FAQ entries for remaining AI references
  - [ ] 14.10 Save and verify JSON validity

- [ ] 15.0 Update FAQ - Hebrew (Apply Same Changes)
  - [ ] 15.1 Open `locales/he/faq.json`
  - [ ] 15.2 Remove multi-book discount sections
  - [ ] 15.3 Remove image editing/regeneration references (אפשרויות איור)
  - [ ] 15.4 Replace AI terminology with magical language
  - [ ] 15.5 Add note about illustrations not being changeable after generation
  - [ ] 15.6 Save and verify JSON validity

- [ ] 16.0 Update FAQ - German (Apply Same Changes)
  - [ ] 16.1 Open `locales/de/faq.json`
  - [ ] 16.2 Remove multi-book discount sections
  - [ ] 16.3 Remove image editing/regeneration references
  - [ ] 16.4 Replace AI terminology with magical language
  - [ ] 16.5 Add note about illustrations not being changeable after generation
  - [ ] 16.6 Save and verify JSON validity

### PHASE 4: Content Updates - Footer & About (Priority: MEDIUM)

- [ ] 17.0 Update Footer - Community Books to Our Recommended Books (English)
  - [ ] 17.1 Open `locales/en/footer.json`
  - [ ] 17.2 Change `sections.quickLinks.community` from "Community Books" to "Our Recommended Books"
  - [ ] 17.3 Save and verify JSON validity

- [ ] 18.0 Update Footer - Community Books to Our Recommended Books (Hebrew)
  - [ ] 18.1 Open `locales/he/footer.json`
  - [ ] 18.2 Change `sections.quickLinks.community` from "ספרי הקהילה" to "הספרים המומלצים שלנו"
  - [ ] 18.3 Save and verify JSON validity

- [ ] 19.0 Update Footer - Community Books to Our Recommended Books (German)
  - [ ] 19.1 Open `locales/de/footer.json`
  - [ ] 19.2 Change `sections.quickLinks.community` from "Community Books" to "Unsere empfohlenen Bücher"
  - [ ] 19.3 Save and verify JSON validity

- [ ] 20.0 Update About Page - Community References (English)
  - [ ] 20.1 Open `locales/en/about.json`
  - [ ] 20.2 Change `cta.secondary` from "Explore Community Books" to "Explore Our Books"
  - [ ] 20.3 Save and verify JSON validity

- [ ] 21.0 Update About Page - Community References (Hebrew)
  - [ ] 21.1 Open `locales/he/about.json`
  - [ ] 21.2 Change `cta.secondary` from "גלו ספרי קהילה" to "גלו את הספרים שלנו"
  - [ ] 21.3 Save and verify JSON validity

- [ ] 22.0 Update About Page - Community References (German)
  - [ ] 22.1 Open `locales/de/about.json`
  - [ ] 22.2 Change `cta.secondary` from community reference to "Entdecken Sie unsere Bücher"
  - [ ] 22.3 Save and verify JSON validity

### PHASE 5: Content Updates - Terms & Privacy (Priority: MEDIUM)

- [ ] 23.0 Update Terms - Replace AI Terminology (English)
  - [ ] 23.1 Open `locales/en/terms.json`
  - [ ] 23.2 Search for all instances of "AI"
  - [ ] 23.3 Replace with magical/story creation language as appropriate
  - [ ] 23.4 Save and verify JSON validity

- [ ] 24.0 Update Terms - Replace AI Terminology (Hebrew)
  - [ ] 24.1 Open `locales/he/terms.json`
  - [ ] 24.2 Search for all instances of AI terminology
  - [ ] 24.3 Replace with magical/story creation language
  - [ ] 24.4 Save and verify JSON validity

- [ ] 25.0 Update Terms - Replace AI Terminology (German)
  - [ ] 25.1 Open `locales/de/terms.json`
  - [ ] 25.2 Search for all instances of AI terminology
  - [ ] 25.3 Replace with magical/story creation language
  - [ ] 25.4 Save and verify JSON validity

- [ ] 26.0 Update Privacy - Replace AI Terminology (English)
  - [ ] 26.1 Open `locales/en/privacy.json`
  - [ ] 26.2 Search for all instances of "AI"
  - [ ] 26.3 Replace with magical/story creation language
  - [ ] 26.4 Save and verify JSON validity

- [ ] 27.0 Update Privacy - Replace AI Terminology (Hebrew)
  - [ ] 27.1 Open `locales/he/privacy.json`
  - [ ] 27.2 Search for all instances of AI terminology
  - [ ] 27.3 Replace with magical/story creation language
  - [ ] 27.4 Save and verify JSON validity

- [ ] 28.0 Update Privacy - Replace AI Terminology (German)
  - [ ] 28.1 Open `locales/de/privacy.json`
  - [ ] 28.2 Search for all instances of AI terminology
  - [ ] 28.3 Replace with magical/story creation language
  - [ ] 28.4 Save and verify JSON validity

### PHASE 6: Fix Hydration Error (Priority: HIGH)

- [ ] 29.0 Diagnose and Fix AboutHero Hydration Error
  - [ ] 29.1 Open `components/AboutHero/AboutHero.tsx`
  - [ ] 29.2 Check for any dynamic content rendered on initial load (Date.now(), Math.random())
  - [ ] 29.3 Check for typeof window checks that differ between server/client
  - [ ] 29.4 Verify translation strings are identical between server and client
  - [ ] 29.5 Check for any browser-specific code running during SSR
  - [ ] 29.6 If using dynamic data, wrap in useEffect with client-only rendering
  - [ ] 29.7 Test page load in browser console for hydration warnings
  - [ ] 29.8 Verify error is resolved
  - [ ] 29.9 Test in all three languages

### PHASE 7: Testing & Validation (Priority: CRITICAL)

- [ ] 30.0 Build and Type Check
  - [ ] 30.1 Run `npm run build` and verify no errors
  - [ ] 30.2 Run `npm run type-check` and verify no TypeScript errors
  - [ ] 30.3 Fix any compilation errors found
  - [ ] 30.4 Verify all imports resolve correctly

- [ ] 31.0 Test Pricing Page
  - [ ] 31.1 Navigate to `/en/pricing` and verify single book pricing displays
  - [ ] 31.2 Navigate to `/he/pricing` and verify Hebrew pricing displays correctly
  - [ ] 31.3 Navigate to `/de/pricing` and verify German pricing displays correctly
  - [ ] 31.4 Verify no multi-book packages shown
  - [ ] 31.5 Verify no discount messaging appears
  - [ ] 31.6 Check browser console for errors

- [ ] 32.0 Test FAQ Page
  - [ ] 32.1 Navigate to `/en/faq` and verify content loads
  - [ ] 32.2 Verify no multi-book discount questions appear
  - [ ] 32.3 Verify no image editing references appear
  - [ ] 32.4 Verify no "AI" terminology in user-facing text
  - [ ] 32.5 Test search functionality works
  - [ ] 32.6 Test in Hebrew (`/he/faq`) and German (`/de/faq`)
  - [ ] 32.7 Check browser console for errors

- [ ] 33.0 Test About Page
  - [ ] 33.1 Navigate to `/en/about` and verify page loads
  - [ ] 33.2 Verify TeamPhotos sections are removed
  - [ ] 33.3 Verify "What We Believe In" section is removed
  - [ ] 33.4 Verify no hydration errors in console
  - [ ] 33.5 Test CTA button text shows "Explore Our Books" not "Community Books"
  - [ ] 33.6 Test in Hebrew (`/he/about`) and German (`/de/about`)
  - [ ] 33.7 Check browser console for errors

- [ ] 34.0 Test Footer
  - [ ] 34.1 Verify newsletter signup form is removed
  - [ ] 34.2 Verify social media links are removed
  - [ ] 34.3 Verify "Community Books" changed to "Our Recommended Books"
  - [ ] 34.4 Test footer on all pages
  - [ ] 34.5 Test in all three languages
  - [ ] 34.6 Check browser console for errors

- [ ] 35.0 Test Terms and Privacy Pages
  - [ ] 35.1 Navigate to `/en/terms` and verify no "AI" terminology
  - [ ] 35.2 Navigate to `/en/privacy` and verify no "AI" terminology
  - [ ] 35.3 Test in Hebrew and German
  - [ ] 35.4 Verify pages load without errors

- [ ] 36.0 Cross-Language Consistency Check
  - [ ] 36.1 Create checklist of all content changes
  - [ ] 36.2 Verify each change applied to English
  - [ ] 36.3 Verify each change applied to Hebrew
  - [ ] 36.4 Verify each change applied to German
  - [ ] 36.5 Test language switcher on each page
  - [ ] 36.6 Verify content structure matches across languages

- [ ] 37.0 Final Security and Code Quality Verification
  - [ ] 37.1 Verify middleware validates locale cookie
  - [ ] 37.2 Verify no XSS vulnerabilities in FAQ highlighting
  - [ ] 37.3 Verify SSR safety in all utility functions
  - [ ] 37.4 Verify no `any` types in legal types
  - [ ] 37.5 Run security audit: `npm audit`
  - [ ] 37.6 Review all modified files for code quality

### PHASE 8: Documentation & PR Update (Priority: MEDIUM)

- [ ] 38.0 Update PR Description
  - [ ] 38.1 Document all changes made
  - [ ] 38.2 List all deleted components
  - [ ] 38.3 List all content updates
  - [ ] 38.4 Note security fixes applied
  - [ ] 38.5 Add testing evidence (screenshots)

- [ ] 39.0 Create Migration Notes
  - [ ] 39.1 Document breaking changes (if any)
  - [ ] 39.2 Note removed features for future reference
  - [ ] 39.3 Document feature flags needed for future features

- [ ] 40.0 Final Review Checklist
  - [ ] 40.1 All 17 approval criteria from section 17 met
  - [ ] 40.2 No console errors in any language
  - [ ] 40.3 Build passes without warnings
  - [ ] 40.4 All tests pass (if applicable)
  - [ ] 40.5 Code review completed
  - [ ] 40.6 Ready for merge

---

## 21. TASK EXECUTION NOTES

### For Developers:
- Work through phases sequentially - Phase 1 must be completed before moving to Phase 2
- Each checkbox represents a discrete, testable action
- After completing each major task (1.0, 2.0, etc.), run `npm run build` to catch issues early
- Test in all three languages (en/he/de) after each content update phase
- Keep browser console open during testing to catch runtime errors
- Use git commits after each completed phase for easy rollback if needed

### Estimated Time:
- **Phase 1 (Critical Cleanup):** 3-4 hours
- **Phase 2 (Pricing Updates):** 2-3 hours
- **Phase 3 (FAQ Updates):** 3-4 hours
- **Phase 4 (Footer & About):** 1-2 hours
- **Phase 5 (Terms & Privacy):** 2-3 hours
- **Phase 6 (Hydration Fix):** 1-2 hours
- **Phase 7 (Testing):** 3-4 hours
- **Phase 8 (Documentation):** 1-2 hours
- **Total:** 16-24 hours

### Dependencies:
- Phase 2-6 depend on Phase 1 completion
- Phase 7 depends on Phases 1-6 completion
- Phase 8 depends on Phase 7 completion

### Risk Areas:
- Hydration error fix may require deeper investigation
- Translation consistency requires careful attention to detail
- Security fixes must be tested thoroughly
- Build may reveal additional import issues after deletions
