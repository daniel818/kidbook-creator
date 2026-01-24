# PRD: Website Internationalization (i18n) - Multi-Language Support

## ⚠️ REVISION v2.0

**Date:** January 24, 2026  
**Revision Reason:** Previous implementation attempt using next-intl with `[locale]` routing failed due to incompatibility with Next.js 16.1.1. This PRD uses a **simpler, proven approach** with react-i18next that doesn't require routing changes.

**Key Changes from Original PRD:**
1. ❌ Removed locale-prefixed routing (`/en/`, `/de/`, `/he/`)
2. ❌ Removed middleware-based locale detection  
3. ❌ Removed app directory restructuring
4. ✅ Using react-i18next instead of next-intl
5. ✅ Smaller, testable incremental phases
6. ✅ Each phase is independently deployable
7. ✅ Test after EVERY small change

**Lessons Learned from Failed Attempt:**
- Build success ≠ runtime success - must test immediately
- Next.js 16 has breaking changes with params as Promise
- Middleware merging (i18n + auth) is fragile
- Dynamic `[locale]` segments at root level conflict with routing

---

## Introduction/Overview

This feature implements internationalization (i18n) for KidBook Creator to support three languages: English (default), German (DACH region), and Hebrew (Israel).

**Problem:** The website currently only supports English, limiting our ability to serve German-speaking and Hebrew-speaking markets.

**Goal:** Implement a translation system that:
- Detects user's browser language on first visit
- Supports English (en), German (de), and Hebrew (he)
- Provides manual language switching via UI
- Handles RTL (Right-to-Left) layout for Hebrew
- Translates all user-facing content

**Approach:** Use **react-i18next** with client-side language switching. This approach:
- ✅ Works reliably with Next.js 16
- ✅ Requires NO middleware changes
- ✅ Requires NO app directory restructuring
- ✅ Can be implemented incrementally
- ✅ Each component can be translated independently
- ✅ Proven, mature library with large community

**Trade-offs Accepted:**
- No locale-prefixed URLs (URLs stay as `/create`, `/profile`, etc.)
- SEO handled via hreflang meta tags instead of URL structure
- Language stored in localStorage + cookie, not URL

---

## Goals

1. Implement browser language detection with fallback to English
2. Create centralized translation system using react-i18next
3. Support three languages: English (en), German (de), Hebrew (he)
4. Add language switcher UI next to user profile/sign-in
5. Handle RTL layout for Hebrew
6. Translate all user-facing content incrementally
7. Store user language preference persistently
8. Ensure each phase is testable and deployable independently

---

## User Stories

1. **As a German-speaking user**, I want the website to display in German when I visit, so I can use the platform in my native language.

2. **As a Hebrew-speaking user**, I want the website to display in Hebrew with proper RTL layout, so the interface feels natural.

3. **As a user**, I want to manually switch languages using a language selector next to my profile.

4. **As a multilingual user**, I want my language preference remembered across sessions.

5. **As a user**, I want all UI elements, buttons, and forms to be translated.

6. **As a developer**, I want a simple translation system that's easy to maintain.

7. **As a content creator**, I want translated UI while my book content stays in the language I wrote it.

---

## Functional Requirements

### Language Detection & Storage (FR-001 to FR-004)

**FR-001:** Detect browser language on first visit
- Read `navigator.language` in browser
- Match against supported locales: en, de, he
- Default to English if not supported
- Only detect on first visit (no stored preference)

**FR-002:** Store language preference
- Save to localStorage: `i18nextLng`
- Save to cookie for SSR hints (optional, Phase 2)
- Preference persists across sessions
- Updated when user manually switches

**FR-003:** Load saved language on return visits
- Check localStorage first
- Fall back to browser detection
- Apply language before rendering

**FR-004:** Sync language with user account (optional, Phase 3)
- Store `language_preference` in users table
- Sync on login
- Use account preference over localStorage

### Translation System (FR-005 to FR-010)

**FR-005:** Use react-i18next library
- Install: `npm install react-i18next i18next i18next-browser-languagedetector`
- Configure with supported locales
- Set up namespace structure

**FR-006:** Organize translations by namespace
- Structure: `/locales/[locale]/[namespace].json`
- Namespaces: common, navbar, auth, home, create, profile, orders
- Common namespace for shared UI elements

**FR-007:** Support translation interpolation
- Dynamic values: `t('welcome', { name: 'John' })` → "Welcome, John!"
- Pluralization: `t('books', { count: 5 })` → "5 books"
- Use ICU message format

**FR-008:** Handle missing translations
- Fall back to English
- Log warning in development
- Show English text in production (never show keys)

**FR-009:** Provide translation context provider
- Create `I18nProvider` wrapper component
- Wrap app in provider
- Make `useTranslation` hook available everywhere

**FR-010:** Support lazy loading of translations
- Load only active language
- Load namespaces on demand
- Reduce initial bundle size

### Language Switcher UI (FR-011 to FR-015)

**FR-011:** Display language switcher in navbar
- Position: Next to user profile icon or Sign In button
- Show current language code or flag
- Dropdown with all languages

**FR-012:** Language switcher design
- Current language displayed as button
- Dropdown shows: English, Deutsch, עברית
- Checkmark on current selection
- Close on selection or click outside

**FR-013:** Handle language switching
- Click language to switch immediately
- Update localStorage
- Re-render page with new translations
- No page reload required

**FR-014:** Mobile responsive
- Works on mobile screens
- Touch-friendly tap targets
- Dropdown doesn't overflow screen

**FR-015:** Accessibility
- Keyboard navigation (Tab, Enter, Escape)
- ARIA labels for screen readers
- Focus management

### RTL Support (FR-016 to FR-020)

**FR-016:** Detect RTL language
- Hebrew (he) is RTL
- English and German are LTR
- Set `dir` attribute on `<html>` element

**FR-017:** Apply RTL styles
- Use CSS logical properties where possible
- Add `.rtl` class to body for overrides
- Test all components in RTL mode

**FR-018:** Mirror layouts for RTL
- Flexbox and grid layouts auto-mirror with `dir="rtl"`
- Icons that indicate direction should flip
- Text alignment follows direction

**FR-019:** Preserve LTR content in RTL
- Numbers stay LTR
- URLs and emails stay LTR
- Brand names stay LTR

**FR-020:** RTL-specific CSS file
- Create `/app/rtl.css` for RTL overrides
- Load conditionally when Hebrew is active
- Minimal overrides, rely on logical properties

### Content Translation (FR-021 to FR-026)

**FR-021:** Translate navbar
- Navigation links
- Create Book button
- Sign In / Sign Out
- User menu items

**FR-022:** Translate homepage
- Hero section
- How It Works steps
- Book types section
- Footer

**FR-023:** Translate authentication
- Sign In / Sign Up forms
- Error messages
- Success messages

**FR-024:** Translate book creation
- Setup page
- Editor toolbar
- Preview page
- Order page

**FR-025:** Translate profile pages
- Profile settings
- My Books
- Purchases
- Orders

**FR-026:** Translate error pages
- 404 page
- Error messages
- Loading states

---

## Non-Goals (Out of Scope)

1. ❌ Locale-prefixed URLs (`/en/`, `/de/`, `/he/`)
2. ❌ Server-side locale detection via middleware
3. ❌ Automatic translation of user-generated content
4. ❌ Additional languages beyond en, de, he
5. ❌ Translation management UI
6. ❌ Machine translation integration
7. ❌ Legal document translations (Terms, Privacy)

---

## Technical Considerations

### Tech Stack
- **Library:** react-i18next + i18next
- **Detection:** i18next-browser-languagedetector
- **Storage:** localStorage + optional cookie
- **Styling:** CSS logical properties + RTL overrides

### Why react-i18next over next-intl?
| Feature | react-i18next | next-intl |
|---------|---------------|-----------|
| Next.js 16 compatible | ✅ Yes | ❌ Issues with routing |
| Requires routing changes | ❌ No | ✅ Yes |
| Middleware changes | ❌ No | ✅ Yes |
| App restructuring | ❌ No | ✅ Yes |
| Maturity | 10+ years | 3 years |
| Community size | Very large | Medium |

### File Structure
```
/locales
  /en
    common.json      # Buttons, labels, status
    navbar.json      # Navigation
    auth.json        # Authentication
    home.json        # Homepage
    create.json      # Book creation
    profile.json     # User profile
    orders.json      # Orders
  /de
    [same structure]
  /he
    [same structure]
/lib/i18n
  config.ts          # i18next configuration
  provider.tsx       # I18nProvider component
```

### Component Usage
```typescript
// In any component
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation('common');
  
  return (
    <button>{t('buttons.save')}</button>
  );
}
```

---

## Implementation Phases

### 🔴 CRITICAL RULE: Test After Every Change

Before moving to the next task:
1. Run `npm run dev`
2. Open browser to localhost:3000
3. Verify the page loads without errors
4. Check browser console for errors
5. Only proceed if everything works

---

## Phase 1: Foundation (Day 1) - MINIMAL CHANGES

**Goal:** Set up i18next with ONE translated string, verify it works.

### Tasks

- [ ] **1.1 Install dependencies**
  ```bash
  npm install react-i18next i18next i18next-browser-languagedetector
  ```
  - [ ] Run `npm run dev` - verify app still works
  
- [ ] **1.2 Create i18next config file**
  - Create `/lib/i18n/config.ts`
  - Minimal config with English only
  - [ ] Run `npm run dev` - verify no errors

- [ ] **1.3 Create ONE translation file**
  - Create `/locales/en/common.json`
  - Add ONE key: `{ "test": "Hello World" }`
  - [ ] Verify file is valid JSON

- [ ] **1.4 Create I18nProvider component**
  - Create `/lib/i18n/provider.tsx`
  - Wrap children with I18nextProvider
  - [ ] Run `npm run dev` - verify no errors

- [ ] **1.5 Add provider to layout**
  - Import I18nProvider in `/app/layout.tsx`
  - Wrap children with provider
  - [ ] Run `npm run dev` - verify app loads

- [ ] **1.6 Test translation in ONE component**
  - Add `useTranslation` to Navbar
  - Replace ONE hardcoded string with `t('test')`
  - [ ] Run `npm run dev` - verify "Hello World" appears
  - [ ] If it works, Phase 1 is COMPLETE ✅

**Phase 1 Deliverable:** App loads with one translated string working.

---

## Phase 2: Language Switcher (Day 1-2)

**Goal:** Add language switcher that changes between en/de/he.

### Tasks

- [ ] **2.1 Add German and Hebrew translation files**
  - Create `/locales/de/common.json` with `{ "test": "Hallo Welt" }`
  - Create `/locales/he/common.json` with `{ "test": "שלום עולם" }`
  - [ ] Verify files are valid JSON

- [ ] **2.2 Update i18next config for multiple languages**
  - Add de and he to supported languages
  - Configure language detector
  - [ ] Run `npm run dev` - verify no errors

- [ ] **2.3 Create LanguageSwitcher component**
  - Create `/components/LanguageSwitcher/LanguageSwitcher.tsx`
  - Simple dropdown with three options
  - Use `i18next.changeLanguage()` on click
  - [ ] Test component in isolation

- [ ] **2.4 Add LanguageSwitcher to Navbar**
  - Import and add next to user profile
  - [ ] Run `npm run dev` - verify switcher appears

- [ ] **2.5 Test language switching**
  - Click each language
  - Verify "test" string changes
  - Verify localStorage is updated
  - [ ] If all work, Phase 2 is COMPLETE ✅

**Phase 2 Deliverable:** Working language switcher that persists preference.

---

## Phase 3: RTL Support (Day 2)

**Goal:** Hebrew displays with RTL layout.

### Tasks

- [ ] **3.1 Create RTL detection utility**
  - Create `/lib/i18n/rtl.ts`
  - Function: `isRTL(locale: string): boolean`
  - [ ] Write unit test for utility

- [ ] **3.2 Update HTML dir attribute on language change**
  - Listen to i18next language change event
  - Set `document.documentElement.dir = 'rtl'` or `'ltr'`
  - [ ] Test: Switch to Hebrew, verify dir="rtl" on html

- [ ] **3.3 Create RTL CSS overrides**
  - Create `/app/rtl.css` with minimal overrides
  - Import conditionally or use CSS `:dir(rtl)` selector
  - [ ] Test navbar in RTL mode

- [ ] **3.4 Test all pages in Hebrew**
  - Navigate through app in Hebrew
  - Note any layout issues
  - [ ] Fix critical issues only

**Phase 3 Deliverable:** Hebrew displays with proper RTL layout.

---

## Phase 4: Navbar Translations (Day 2-3)

**Goal:** Fully translate navbar component.

### Tasks

- [ ] **4.1 Extract navbar strings to translation files**
  - Add to `/locales/en/navbar.json`:
    ```json
    {
      "communityBooks": "Community Books",
      "faq": "FAQ",
      "aboutUs": "About Us",
      "createBook": "Create Book",
      "signIn": "Sign In"
    }
    ```
  - [ ] Create German translations
  - [ ] Create Hebrew translations

- [ ] **4.2 Update Navbar.tsx to use translations**
  - Import `useTranslation`
  - Replace all hardcoded strings
  - [ ] Test in all three languages

- [ ] **4.3 Update UserNav.tsx to use translations**
  - Add translations for: My Books, Purchases, Profile, Sign Out
  - [ ] Test in all three languages

**Phase 4 Deliverable:** Navbar fully translated in all languages.

---

## Phase 5: Homepage Translations (Day 3)

**Goal:** Fully translate homepage.

### Tasks

- [ ] **5.1 Create home namespace translations**
  - Extract all homepage strings
  - Create `/locales/en/home.json`
  - [ ] Create German translations
  - [ ] Create Hebrew translations

- [ ] **5.2 Update page.tsx to use translations**
  - Hero section
  - How It Works section
  - Book Types section
  - Footer
  - [ ] Test in all three languages

**Phase 5 Deliverable:** Homepage fully translated.

---

## Phase 6: Auth Translations (Day 3-4)

**Goal:** Translate authentication flows.

### Tasks

- [ ] **6.1 Create auth namespace translations**
  - Sign In / Sign Up forms
  - Error messages
  - Success messages
  - [ ] Create all three language files

- [ ] **6.2 Update AuthModal.tsx**
  - Replace all hardcoded strings
  - [ ] Test sign in flow in all languages
  - [ ] Test sign up flow in all languages

**Phase 6 Deliverable:** Auth flows fully translated.

---

## Phase 7: Book Creation Translations (Day 4-5)

**Goal:** Translate book creation flow.

### Tasks

- [ ] **7.1 Create create namespace translations**
  - Setup page strings
  - Editor strings
  - Preview strings
  - Order strings

- [ ] **7.2 Update create pages**
  - `/app/create/page.tsx`
  - `/app/create/[bookId]/page.tsx`
  - `/app/create/[bookId]/order/page.tsx`
  - [ ] Test full flow in all languages

**Phase 7 Deliverable:** Book creation fully translated.

---

## Phase 8: Profile & Orders (Day 5)

**Goal:** Translate remaining user pages.

### Tasks

- [ ] **8.1 Create profile namespace translations**
- [ ] **8.2 Create orders namespace translations**
- [ ] **8.3 Update profile pages**
- [ ] **8.4 Update orders pages**
- [ ] **8.5 Update purchases pages**

**Phase 8 Deliverable:** All user pages translated.

---

## Phase 9: Polish & QA (Day 6)

**Goal:** Final testing and fixes.

### Tasks

- [ ] **9.1 Full app walkthrough in English**
- [ ] **9.2 Full app walkthrough in German**
- [ ] **9.3 Full app walkthrough in Hebrew (RTL)**
- [ ] **9.4 Fix any missing translations**
- [ ] **9.5 Fix any RTL layout issues**
- [ ] **9.6 Get native speaker review**

**Phase 9 Deliverable:** Production-ready i18n.

---

## Relevant Files

### New Files to Create
- `/lib/i18n/config.ts` - i18next configuration
- `/lib/i18n/provider.tsx` - I18nProvider component
- `/lib/i18n/rtl.ts` - RTL detection utility
- `/locales/en/common.json` - Common English translations
- `/locales/en/navbar.json` - Navbar English translations
- `/locales/en/auth.json` - Auth English translations
- `/locales/en/home.json` - Homepage English translations
- `/locales/en/create.json` - Create flow English translations
- `/locales/en/profile.json` - Profile English translations
- `/locales/en/orders.json` - Orders English translations
- `/locales/de/*.json` - German translations (same structure)
- `/locales/he/*.json` - Hebrew translations (same structure)
- `/components/LanguageSwitcher/LanguageSwitcher.tsx`
- `/components/LanguageSwitcher/LanguageSwitcher.module.css`
- `/components/LanguageSwitcher/index.ts`
- `/app/rtl.css` - RTL style overrides

### Files to Modify
- `/app/layout.tsx` - Add I18nProvider wrapper
- `/components/Navbar/Navbar.tsx` - Add translations + LanguageSwitcher
- `/components/UserNav/UserNav.tsx` - Add translations
- `/components/AuthModal/AuthModal.tsx` - Add translations
- `/app/page.tsx` - Add translations
- `/app/create/page.tsx` - Add translations
- `/app/create/[bookId]/page.tsx` - Add translations
- `/app/profile/page.tsx` - Add translations
- `/app/mybooks/page.tsx` - Add translations
- `/app/orders/page.tsx` - Add translations
- `/app/purchases/page.tsx` - Add translations

### Files NOT Modified
- `/middleware.ts` - NO CHANGES (lesson learned!)
- `/next.config.ts` - NO CHANGES
- App directory structure - NO RESTRUCTURING

---

## Success Metrics

1. **Functionality:** All three languages work without errors
2. **Persistence:** Language preference saved across sessions
3. **RTL:** Hebrew displays correctly with mirrored layout
4. **Coverage:** 100% of UI strings translated
5. **Performance:** No noticeable slowdown from translations
6. **Stability:** No regressions in existing functionality

---

## Risk Mitigation

### From Previous Failure

| Risk | Mitigation |
|------|------------|
| Breaking existing functionality | Test after EVERY change |
| Complex middleware issues | NO middleware changes |
| Routing conflicts | NO routing changes |
| Build vs runtime issues | Always run dev server to test |
| Too many changes at once | Small, incremental phases |

### New Risks

| Risk | Mitigation |
|------|------------|
| Client-side only detection | Acceptable trade-off for stability |
| No URL-based locale | Use hreflang meta tags for SEO |
| Translation file sync | Use TypeScript to validate keys |

---

## Rollback Plan

If any phase fails:
1. Revert only that phase's changes
2. Previous phases remain working
3. Each phase is independently deployable

---

**Status:** Ready for implementation  
**Priority:** High  
**Estimated Effort:** 6 days (vs 3 weeks in original PRD)  
**Dependencies:** react-i18next library  
**Owner:** Engineering Team
