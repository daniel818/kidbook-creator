# Internationalization (i18n) Implementation

## Overview

KidBook Creator supports three languages:
- **English (en)** - Default
- **German (de)** - DACH region
- **Hebrew (he)** - Israel with full RTL support

This document provides an overview of the internationalization system implemented using **react-i18next**.

---

## Architecture

### Technology Stack

- **react-i18next** - React bindings for i18next
- **i18next** - Core internationalization framework
- **i18next-browser-languagedetector** - Automatic language detection

### Why react-i18next?

- ✅ Proven, mature library (10+ years)
- ✅ Works reliably with Next.js 16
- ✅ No routing changes required
- ✅ No middleware modifications needed
- ✅ Large community and ecosystem
- ✅ Incremental implementation possible

---

## File Structure

```
/locales
  /en
    common.json      # Buttons, labels, status messages
    navbar.json      # Navigation items
    auth.json        # Authentication forms
    home.json        # Homepage content
    create.json      # Book creation wizard
    profile.json     # User profile pages
    orders.json      # Order management
    purchases.json   # Purchase history
    mybooks.json     # My Books page
    viewer.json      # Book viewer controls
  /de
    [same structure as /en]
  /he
    [same structure as /en]

/lib/i18n
  config.ts          # i18next configuration and namespace registration
  provider.tsx       # I18nProvider wrapper component
  rtl.ts            # RTL detection and text direction utilities
```

---

## Key Features Implemented

### 1. Language Detection & Storage
- Automatic browser language detection on first visit
- Language preference stored in localStorage
- Manual language switching via navbar dropdown
- Persists across sessions

### 2. RTL (Right-to-Left) Support for Hebrew
- Automatic text direction detection
- `dir="rtl"` attribute applied to document
- CSS logical properties for layout
- Specialized RTL overrides for:
  - Book viewer page layout (text left, illustration right)
  - Page numbering (right page = lower number)
  - Drop cap positioning (right side)
  - Margin lines (right side)
  - Navigation elements

### 3. Component Translation
All major components translated:
- ✅ Navbar
- ✅ Homepage
- ✅ Authentication (Sign In/Sign Up)
- ✅ Book Creation Wizard
- ✅ Profile Pages
- ✅ My Books
- ✅ Book Viewer
- ✅ Orders & Purchases

### 4. Book Content Internationalization
- AI prompts localized for each language
- Book language stored in database
- Cover page translations
- "The End" back cover translation
- Page numbering adapted for RTL

---

## Usage Examples

### Basic Translation in Components

```typescript
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation('common');
  
  return (
    <div>
      <button>{t('buttons.save')}</button>
      <p>{t('messages.success')}</p>
    </div>
  );
}
```

### Multiple Namespaces

```typescript
export function MyComponent() {
  const { t } = useTranslation(['common', 'navbar']);
  
  return (
    <div>
      <button>{t('common:buttons.save')}</button>
      <nav>{t('navbar:links.home')}</nav>
    </div>
  );
}
```

### Interpolation

```typescript
// Translation file: { "greeting": "Hello, {{name}}!" }

const { t } = useTranslation('common');
return <p>{t('greeting', { name: 'Alice' })}</p>;
// Output: "Hello, Alice!"
```

### Pluralization

```typescript
// Translation file:
// {
//   "items": "{{count}} item",
//   "items_other": "{{count}} items"
// }

const { t } = useTranslation('common');
return <p>{t('items', { count: 5 })}</p>;
// Output: "5 items"
```

---

## RTL Implementation Details

### Text Direction Detection

The system automatically detects RTL languages and applies appropriate styling:

```typescript
// lib/i18n/rtl.ts
export function getTextDirection(language: string): 'ltr' | 'rtl' {
  return language === 'he' ? 'rtl' : 'ltr';
}
```

### Document Direction

The `dir` attribute is automatically set on the document:

```typescript
// lib/i18n/provider.tsx
useEffect(() => {
  const direction = getTextDirection(i18n.language);
  document.documentElement.dir = direction;
}, [i18n.language]);
```

### CSS RTL Overrides

RTL-specific styles use attribute selectors:

```css
/* Normal LTR */
.element {
  margin-left: 1rem;
}

/* RTL override */
[dir="rtl"] .element {
  margin-left: 0;
  margin-right: 1rem;
}
```

### Book Viewer RTL

For Hebrew books, the page layout is swapped:
- **LTR:** Illustration (left) → Text (right)
- **RTL:** Text (left) → Illustration (right)

Page numbering is also reversed:
- **LTR:** Left page = odd (1, 3, 5...), Right page = even (2, 4, 6...)
- **RTL:** Left page = even (2, 4, 6...), Right page = odd (1, 3, 5...)

---

## Configuration

### i18next Configuration

Located in `/lib/i18n/config.ts`:

```typescript
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: commonEN, navbar: navbarEN, ... },
      de: { common: commonDE, navbar: navbarDE, ... },
      he: { common: commonHE, navbar: navbarHE, ... },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'de', 'he'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });
```

---

## Translation Files

### Naming Convention

- Use **camelCase** for keys: `myButton`, `errorMessage`
- Use **dot notation** for nesting: `buttons.save`, `errors.notFound`
- Keep keys descriptive and context-specific

### Example Structure

```json
{
  "buttons": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete"
  },
  "messages": {
    "success": "Operation successful",
    "error": "An error occurred"
  },
  "forms": {
    "email": "Email address",
    "password": "Password"
  }
}
```

---

## Testing

### Manual Testing Checklist

1. **Language Switching**
   - [ ] Switch between en/de/he using navbar dropdown
   - [ ] Verify language persists after page reload
   - [ ] Check all UI elements update correctly

2. **RTL Layout (Hebrew)**
   - [ ] Document direction changes to RTL
   - [ ] Text alignment is correct
   - [ ] Navigation elements mirror correctly
   - [ ] Book viewer displays RTL layout

3. **Book Creation**
   - [ ] Create books in each language
   - [ ] Verify AI generates content in correct language
   - [ ] Check book language is stored in database

4. **Book Viewing**
   - [ ] Hebrew books display RTL layout
   - [ ] Page numbering is correct for RTL
   - [ ] Drop cap on correct side
   - [ ] Cover and back cover translations correct

---

## Known Limitations

1. **No locale-prefixed URLs** - URLs remain language-neutral (`/create`, not `/en/create`)
2. **Client-side only** - Language detection happens in browser, not server
3. **No SEO optimization** - Would require hreflang meta tags (future enhancement)
4. **3D Book Viewer** - RTL support not yet implemented
5. **PDF Export** - RTL support not yet implemented

---

## Future Enhancements

1. Add more languages (French, Spanish, etc.)
2. Implement RTL support for 3D book viewer
3. Add RTL support for PDF generation
4. Add hreflang meta tags for SEO
5. Create translation management UI
6. Implement translation validation/linting

---

## Troubleshooting

### Translation not showing

1. Check if namespace is registered in `/lib/i18n/config.ts`
2. Verify translation file exists in `/locales/{lang}/{namespace}.json`
3. Check browser console for i18next errors
4. Ensure component uses correct namespace: `useTranslation('namespace')`

### RTL not working

1. Verify `dir` attribute on `<html>` element
2. Check if language is correctly detected as 'he'
3. Ensure CSS RTL overrides are present
4. Clear localStorage and test again

### Language not persisting

1. Check localStorage for `i18nextLng` key
2. Verify LanguageDetector is configured correctly
3. Check browser console for storage errors

---

## Related Documentation

- [Adding a New Language](./README-ADD-LANGUAGE.md)
- [Component Translation Guide](./README-COMPONENT-TRANSLATION.md)
- [PRD: Internationalization](../00-prds/prd-internationalization.md)

---

## Support

For questions or issues related to internationalization:
1. Check this documentation first
2. Review the PRD for context and decisions
3. Check react-i18next documentation: https://react.i18next.com/
4. Consult the development team
