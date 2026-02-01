# PRD: UX/UI Updates - January 2026

**Date:** 2026-01-30  
**Branch:** `ux/ui-updates`  
**Status:** In Progress

---

## Overview

This PRD covers a collection of UX/UI improvements across multiple pages of the KidBook Creator application. The changes focus on improving user experience, consistency, and functionality.

---

## Issues & Tasks

### 1. Book Creation Flow (`/create`)

| ID | Issue | Description | Priority | Status |
|----|-------|-------------|----------|--------|
| 1a | **Name Label Update** | Change "Child's Name" to "Main Character's Name" - the hero may not be a child | High | ✅ Done |
| 1b | **Footer Visibility** | Hide footer during story creation flow - footer should not appear on scroll | High | ✅ Done |
| 1c | **Name Capitalization** | Auto-capitalize first letter of name for LTR languages (e.g., "daniel" → "Daniel") | Medium | ✅ Done |
| 1d | **Theme-Specific Examples** | Show 2 different story examples per theme that change when theme is selected | Medium | ✅ Done |
| 1e | **Title Formatting** | Auto-format book title to Title Case (capitalize main words) | Medium | ✅ Done |
| 1f | **Image Placeholders** | Replace current emojis/icons with transparent magical illustrations for book types, formats, and themes | High | ⏳ Pending |

**Files to modify:**
- `app/create/page.tsx` - Main wizard logic
- `locales/en.json`, `locales/de.json`, `locales/he.json` - Translation updates

---

### 2. Pricing Page (`/[locale]/pricing`)

| ID | Issue | Description | Priority | Status |
|----|-------|-------------|----------|--------|
| 2a | **Title Redundancy** | Hero shows "Choose the perfect package..." and section shows "Pricing" + same subtitle - reduce to max 2 titles | Medium | ✅ Done |
| 2b | **CTA Button Placement** | Remove top "Start Creating" button in hero, keep only bottom CTA | Low | ✅ Done |

**Files to modify:**
- `app/[locale]/pricing/page.tsx`
- `locales/en.json`, `locales/de.json`, `locales/he.json`

---

### 3. FAQ Page (`/[locale]/faq`)

| ID | Issue | Description | Priority | Status |
|----|-------|-------------|----------|--------|
| 3a | **Missing Hero Section** | Add hero section similar to Pricing and About Us pages | Medium | ✅ Done |

**Files to modify:**
- `app/[locale]/faq/page.tsx`
- `app/[locale]/faq/page.module.css` (create if needed)
- `locales/en.json`, `locales/de.json`, `locales/he.json`

---

### 4. Order Page (`/create/[bookId]/order`)

| ID | Issue | Description | Priority | Status |
|----|-------|-------------|----------|--------|
| 4a | **Missing Navbar** | Add Navbar component to order page | High | ✅ Done |
| 4b | **Missing Translations** | Add i18n translations for all order page text | High | ✅ Done |
| 4c | **Price Unavailable** | Show placeholder price based on pricing page values when Lulu API fails | High | ⏳ Pending |
| 4d | **Digital/Print Option** | Add choice between "Digital Only" (free shipping, instant) vs "Print + Digital" | High | ✅ Done |
| 4e | **Size Options** | Update size options to Square (8x8) and Novella (8x10) only | Medium | ✅ Done |

**Files to modify:**
- `app/create/[bookId]/order/page.tsx`
- `locales/en.json`, `locales/de.json`, `locales/he.json`

---

### 5. Home Page - How It Works Section

| ID | Issue | Description | Priority | Status |
|----|-------|-------------|----------|--------|
| 5a | **Uninspiring Flow** | Current 3-step flow doesn't match brand guidelines. Update to 4 inspiring stages: Setup Your Book, Create Your Story, Preview & Perfect, Order & Enjoy | Medium | ✅ Done |
| 5b | **Remove AI Wording** | Replace "Let AI bring your vision to life" with magical language that doesn't mention AI | High | ✅ Done |

**Files to modify:**
- `app/[locale]/page.tsx` (home page)
- `locales/en.json`, `locales/de.json`, `locales/he.json`

**Design Notes:**
- Make it more magical and aligned with brand guidelines
- Add 4th step: "Order & Enjoy" with appropriate icon and description
- Use more inspiring language throughout

---

### 6. Book Viewer - RTL/LTR Orientation Bug

| ID | Issue | Description | Priority | Status |
|----|-------|-------------|----------|--------|
| 6a | **Wrong Text Orientation** | When viewing a book, the text orientation doesn't match the book's language. Hebrew books show LTR layout when UI is in English, and English books show RTL layout when UI is in Hebrew. Need to detect book language and apply correct direction. | High | ✅ Done |
| 6b | **Letter Position Bug** | Large decorative letters on text pages are positioned incorrectly - should be on right for RTL books and left for LTR books | High | ✅ Done |

**Files to modify:**
- `components/StoryBookViewer.tsx` or `components/StoryBookViewer3D.tsx`
- Book viewer components need to detect book language and override UI direction

**Technical Details:**
- Before opening a book, identify the book's language from the content
- Apply `dir="rtl"` or `dir="ltr"` to the book viewer container based on book language, not UI language
- Ensure page numbers and text alignment follow the book's language direction

---

## Implementation Phases

### Phase 1: Critical Fixes (PR #1)
**Priority: High | Estimated: 2-3 hours**

1. **1a** - Update name label to "Main Character's Name"
2. **1b** - Hide footer in creation flow
3. **4a** - Add Navbar to order page
4. **4c** - Add fallback pricing when API unavailable

### Phase 2: Order Page Enhancements (PR #2)
**Priority: High | Estimated: 3-4 hours**

1. **4b** - Add full i18n support for order page
2. **4d** - Add Digital Only vs Print + Digital option

### Phase 3: UX Polish (PR #3)
**Priority: Medium | Estimated: 2-3 hours**

1. **1c** - Name auto-capitalization
2. **1d** - Theme-specific story examples
3. **1e** - Title auto-formatting to Title Case
4. **2a** - Reduce pricing page title redundancy
5. **2b** - Remove top CTA button
6. **3a** - Add FAQ hero section

### Phase 4: Home Page & Book Viewer (PR #4)
**Priority: Medium-High | Estimated: 2-3 hours**

1. **5a** - Update "How It Works" to 4 inspiring stages
2. **6a** - Fix book viewer RTL/LTR orientation based on book language

---

## Technical Implementation Details

### 1a. Name Label Update
```typescript
// locales/en.json - create.steps.child
"nameLabel": "Main Character's Name"
"subtitle": "Tell us about the special hero who will star in this book"
```

### 1b. Footer Visibility
Add CSS to hide footer on `/create` route or conditionally render Footer component.

### 1c. Name Capitalization
```typescript
// Utility function
function capitalizeFirstLetter(name: string): string {
  if (!name) return name;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// Apply on blur or before submission
```

### 1d. Theme-Specific Examples
```typescript
// Add to locales
"themeExamples": {
  "adventure": [
    "e.g. A brave journey through enchanted forests to find a hidden treasure",
    "e.g. An exciting quest to rescue a magical creature from a dragon's lair"
  ],
  "bedtime": [
    "e.g. A peaceful journey to dreamland with friendly stars",
    "e.g. A cozy story about saying goodnight to forest friends"
  ],
  // ... other themes
}
```

### 1e. Title Formatting
```typescript
function toTitleCase(str: string): string {
  const minorWords = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by', 'of'];
  return str.split(' ').map((word, index) => {
    if (index === 0 || !minorWords.includes(word.toLowerCase())) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    return word.toLowerCase();
  }).join(' ');
}
```

### 4c. Fallback Pricing
```typescript
// Use pricing from pricing page as fallback
const FALLBACK_PRICING = {
  USD: { softcover: 35, hardcover: 45 },
  EUR: { softcover: 32, hardcover: 42 },
  ILS: { softcover: 130, hardcover: 165 }
};
```

### 4d. Digital/Print Option
Add new state and UI for product type selection:
- **Digital Only**: $15 USD, free shipping, instant download
- **Print + Digital**: $45 USD, shipping calculated, includes digital copy

---

## Translation Keys to Add

### English (`locales/en.json`)
```json
{
  "create": {
    "steps": {
      "child": {
        "nameLabel": "Main Character's Name",
        "subtitle": "Tell us about the special hero who will star in this book"
      },
      "theme": {
        "examples": {
          "adventure": ["...", "..."],
          "bedtime": ["...", "..."],
          "learning": ["...", "..."],
          "fantasy": ["...", "..."],
          "animals": ["...", "..."],
          "custom": ["...", "..."]
        }
      }
    }
  },
  "order": {
    "header": {
      "title": "Order Your Book",
      "backToBook": "← Back to Book"
    },
    "productType": {
      "title": "Choose Your Product",
      "digitalOnly": "Digital Only",
      "digitalOnlyDesc": "Instant PDF download",
      "printDigital": "Print + Digital",
      "printDigitalDesc": "Printed book + instant PDF"
    },
    "pricing": {
      "bookPrice": "Book price (printing + production)",
      "unavailable": "Unavailable",
      "shipping": "Shipping",
      "shippingFree": "Free",
      "shippingCalculated": "Calculated after address",
      "total": "Total"
    },
    "steps": {
      "options": "Options",
      "shipping": "Shipping",
      "review": "Review",
      "payment": "Payment"
    }
  },
  "faq": {
    "hero": {
      "title": "How Can We Help?",
      "subtitle": "Find answers to common questions about creating personalized children's books"
    }
  }
}
```

---

## Acceptance Criteria

### Phase 1
- [ ] Name field shows "Main Character's Name" in all languages
- [ ] Footer is hidden during book creation flow
- [ ] Order page displays Navbar
- [ ] Order page shows fallback price when API unavailable

### Phase 2
- [ ] All order page text is translatable
- [ ] User can choose between Digital Only and Print + Digital
- [ ] Digital Only shows free shipping and instant delivery
- [ ] Print + Digital shows calculated shipping

### Phase 3
- [ ] Names are auto-capitalized on input
- [ ] Story examples change based on selected theme
- [ ] Book titles are auto-formatted to Title Case
- [ ] Pricing page has cleaner title hierarchy
- [ ] FAQ page has hero section matching other pages

---

## Notes

- Keep code lean and minimal
- Reuse existing components where possible
- All changes must include translations for EN, DE, HE
- Test RTL layout for Hebrew translations
